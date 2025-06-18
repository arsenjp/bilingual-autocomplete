const fs = require('fs')
const path = require('path')
const { default: Kuroshiro } = require('kuroshiro')
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')

class SimpleSemanticGenerator {
  constructor() {
    this.semanticSets = new Set()
    this.kuroshiro = null
    this.initialized = false
  }

  async init() {
    if (this.initialized) return
    
    this.kuroshiro = new Kuroshiro()
    await this.kuroshiro.init(new KuromojiAnalyzer())
    this.initialized = true
    console.log('Kuroshiro initialized')
  }

  // Convert a term to all script variations
  async convertToAllScripts(text) {
    if (!this.initialized) await this.init()
    
    const variations = new Set()
    
    // Add original text
    variations.add(text)
    
    // Convert to hiragana
    const hiragana = await this.kuroshiro.convert(text, { to: 'hiragana' })
    variations.add(hiragana)
    
    // Convert to katakana
    const katakana = await this.kuroshiro.convert(text, { to: 'katakana' })
    variations.add(katakana)
    
    // If the original text is kana-only, try to find its kanji form
    if (!/[\u4e00-\u9faf]/.test(text)) {
      try {
        const analyzer = this.kuroshiro._analyzer
        const analyzed = await analyzer.parse(text)
        
        // Look for kanji forms in the analysis
        for (const token of analyzed) {
          if (token.pos.startsWith('名詞') && /[\u4e00-\u9faf]/.test(token.surface_form)) {
            variations.add(token.surface_form)
          }
        }
      } catch (error) {
        console.warn(`Failed to find kanji form for ${text}:`, error)
      }
    }
    
    return Array.from(variations)
  }

  // Extract words from text using various patterns
  async extractWords(text) {
    if (!this.initialized) await this.init()
    
    const words = new Set()
    
    // First split by parentheses and brackets
    const parts = []
    let currentText = text
    
    // Handle both Japanese and English parentheses
    while (currentText.includes('（') || currentText.includes('(')) {
      const jpParenIndex = currentText.indexOf('（')
      const enParenIndex = currentText.indexOf('(')
      const parenIndex = jpParenIndex === -1 ? enParenIndex : 
                        enParenIndex === -1 ? jpParenIndex :
                        Math.min(jpParenIndex, enParenIndex)
      
      const beforeParen = currentText.substring(0, parenIndex)
      const afterParen = currentText.substring(
        currentText.indexOf(currentText[parenIndex] === '（' ? '）' : ')') + 1
      )
      const insideParen = currentText.substring(
        parenIndex + 1,
        currentText.indexOf(currentText[parenIndex] === '（' ? '）' : ')')
      )
      
      if (beforeParen) parts.push(beforeParen)
      if (insideParen) parts.push(insideParen)
      currentText = afterParen
    }
    if (currentText) parts.push(currentText)
    
    // Now process each part
    for (const part of parts) {
      // Split by middle dot (both full-width and half-width)
      const dotParts = part.split(/[・･]/)
      for (const dotPart of dotParts) {
        const trimmed = dotPart.trim()
        if (trimmed) {
          // Split by spaces and other common separators
          const subParts = trimmed.split(/[\s,、\/]+/)
          for (const subPart of subParts) {
            const finalTrimmed = subPart.trim()
            if (finalTrimmed) {
              // Skip single English letters
              if (!/^[A-Za-z]$/.test(finalTrimmed)) {
                words.add(finalTrimmed)
              }
            }
          }
        }
      }
    }
    
    return Array.from(words)
  }

  // Generate semantic sets from texts
  async generateSemanticSets(texts) {
    if (!this.initialized) await this.init()
    
    const semanticSets = new Set()
    
    console.log('Processing texts for semantic sets...')
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      console.log(`Processing text ${i + 1}/${texts.length}: ${text.substring(0, 50)}...`)
      
      const words = await this.extractWords(text)
      
      for (const word of words) {
        const variations = await this.convertToAllScripts(word)
        if (variations.length > 0) {
          semanticSets.add(variations)
        }
      }
    }
    
    return Array.from(semanticSets)
  }

  async addEnglishTerms(semanticSets, translations, isExtended = false) {
    const enhancedSets = semanticSets.map(set => {
      const enhancedSet = [...set]
      for (const term of set) {
        if (translations[term]) {
          enhancedSet.push(...translations[term])
        }
      }
      return enhancedSet
    })
    
    // Find untranslated Japanese terms
    const untranslatedTerms = new Map()
    
    semanticSets.forEach(set => {
      // Check if any term in the set has a translation
      const hasTranslation = set.some(term => 
        translations[term] && translations[term].length > 0
      )
      
      if (!hasTranslation) {
        // Check if set contains any Japanese terms
        const hasJapaneseTerm = set.some(term => /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(term))
        
        if (!hasJapaneseTerm) {
          return // Skip this set as it contains no Japanese terms
        }
        
        // First try to find a kanji term
        const kanjiTerm = set.find(term => /[\u4e00-\u9faf]/.test(term))
        if (kanjiTerm) {
          untranslatedTerms.set(kanjiTerm, [])
        } else {
          // If no kanji, find the katakana term
          const katakanaTerm = set.find(term => /^[\u30a0-\u30ff]+$/.test(term))
          if (katakanaTerm) {
            untranslatedTerms.set(katakanaTerm, [])
          } else {
            // If no katakana, use the first Japanese term
            const japaneseTerm = set.find(term => /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(term))
            if (japaneseTerm) {
              untranslatedTerms.set(japaneseTerm, [])
            }
          }
        }
      }
    })
    
    // Export untranslated terms
    if (untranslatedTerms.size > 0) {
      const untranslatedObj = Object.fromEntries(untranslatedTerms)
      const outputPath = path.join('dist', isExtended ? 'suggested-extended-translations.json' : 'suggested-translations.json')
      fs.writeFileSync(outputPath, JSON.stringify(untranslatedObj, null, 2), 'utf8')
      console.log(`\n📝 Exported ${untranslatedTerms.size} untranslated terms to ${outputPath}`)
    }
    
    return enhancedSets
  }

  async analyzeAndDivideWord(word) {
    if (!this.initialized) await this.init()
    
    try {
      const analyzer = this.kuroshiro._analyzer
      const analyzed = await analyzer.parse(word)
      
      // Debug log the full analysis
      console.log(`Analyzing word: ${word}`)
      
      const nouns = []
      
      // Extract all nouns from the analysis
      for (const token of analyzed) {
        console.log(`Token: ${token.surface_form} (${token.pos})`)
        
        // Check if it's a noun
        if (token.pos.startsWith('名詞')) {
          // Skip very short words
          if (token.surface_form.length < 2) {
            console.log(`Skipping short noun: ${token.surface_form}`)
            continue
          }
          
          // Skip if the word starts with a small kana (ぁ-ぉ, ァ-ォ)
          if (/^[ぁ-ぉァ-ォ]/.test(token.surface_form)) {
            console.log(`Skipping word starting with small kana: ${token.surface_form}`)
            continue
          }
          
          // Skip if the word is kana-only and short
          if (/^[ぁ-んァ-ンー]+$/.test(token.surface_form) && token.surface_form.length < 4) {
            console.log(`Skipping short kana-only word: ${token.surface_form}`)
            continue
          }
          
          // Skip if the word contains small kana in the middle
          if (/[ぁ-ぉァ-ォ]/.test(token.surface_form)) {
            console.log(`Skipping word with small kana in middle: ${token.surface_form}`)
            continue
          }
          
          // Skip if the word is just a single kana character
          if (/^[ぁ-んァ-ンー]$/.test(token.surface_form)) {
            console.log(`Skipping single kana character: ${token.surface_form}`)
            continue
          }
          
          console.log(`Found noun: ${token.surface_form} (${token.pos})`)
          nouns.push({
            surface_form: token.surface_form,
            base_form: token.basic_form || token.surface_form,
            pos: token.pos
          })
        }
      }
      
      if (nouns.length > 0) {
        return {
          canDivide: true,
          nouns: nouns
        }
      }
      
      return {
        canDivide: false,
        nouns: []
      }
    } catch (error) {
      console.warn(`Failed to analyze word ${word}:`, error)
      return {
        canDivide: false,
        nouns: []
      }
    }
  }

  async generateExtendedSemanticSets(semanticSets) {
    if (!this.initialized) await this.init()
    
    const extendedSets = new Map() // Use Map to track base forms
    const seenTerms = new Set() // Track seen terms to prevent duplicates
    
    console.log('Generating extended semantic sets from all nouns...')
    
    for (const set of semanticSets) {
      for (const term of set) {
        // Only analyze Japanese terms
        if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(term)) {
          const analysis = await this.analyzeAndDivideWord(term)
          
          if (analysis.canDivide && analysis.nouns.length > 0) {
            // Create semantic sets for each noun
            for (const noun of analysis.nouns) {
              // Skip if the noun is the same as the original term
              if (noun.surface_form === term) {
                continue
              }
              
              // Convert to katakana for base form
              const katakanaBase = await this.kuroshiro.convert(noun.surface_form, { to: 'katakana' })
              
              // Skip if we've already processed this word
              if (seenTerms.has(katakanaBase)) continue
              seenTerms.add(katakanaBase)
              
              // Get all script variations
              const variations = await this.convertToAllScripts(noun.surface_form)
              if (variations.length > 0) {
                // Sort variations to ensure consistent ordering
                const sortedVariations = variations.sort()
                extendedSets.set(katakanaBase, sortedVariations)
              }
            }
          }
        }
      }
    }
    
    return Array.from(extendedSets.values())
  }

  // Export semantic sets to JSON
  exportAsJson(semanticSets, filename = 'simple-semantic-sets.json') {
    const outputPath = path.join('dist', filename)
    
    const data = {
      generatedAt: new Date().toISOString(),
      semanticSets: semanticSets
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8')
    console.log(`Exported semantic sets to ${outputPath}`)
    console.log(`  - Total sets: ${semanticSets.length}`)
  }

  // Export extended semantic sets to JSON
  exportExtendedAsJson(extendedSets, filename = 'extended-semantic-sets.json') {
    const outputPath = path.join('dist', filename)
    
    const data = {
      generatedAt: new Date().toISOString(),
      extendedSemanticSets: extendedSets
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8')
    console.log(`Exported extended semantic sets to ${outputPath}`)
    console.log(`  - Total extended sets: ${extendedSets.length}`)
  }
}

// Example usage
async function generateSemanticSets() {
  // Import test data and mappings from JSON files
  const sampleTexts = JSON.parse(fs.readFileSync(path.join('input', 'sample-texts.json'), 'utf8'))
  const translations = JSON.parse(fs.readFileSync(path.join('input', 'translations.json'), 'utf8'))
  
  const generator = new SimpleSemanticGenerator()
  
  try {
    console.log('🔍 Generating semantic sets...')
    console.log(`📝 Processing ${sampleTexts.length} texts...`)
    
    let semanticSets = await generator.generateSemanticSets(sampleTexts)
    
    console.log(`\n📊 Generated sets:`)
    console.log(`  - Total sets: ${semanticSets.length}`)
    
    // Generate extended semantic sets
    console.log('\n🔍 Generating extended semantic sets...')
    let extendedSets = await generator.generateExtendedSemanticSets(semanticSets)
    
    // Add English terms to both sets
    semanticSets = await generator.addEnglishTerms(semanticSets, translations, false)
    extendedSets = await generator.addEnglishTerms(extendedSets, translations, true)
    
    console.log('\n🔗 Semantic sets:')
    semanticSets.forEach((set, index) => {
      console.log(`  Set ${index + 1}: [${set.join(', ')}]`)
    })
    
    console.log('\n🔗 Extended semantic sets:')
    extendedSets.forEach((set, index) => {
      console.log(`  Extended Set ${index + 1}: [${set.join(', ')}]`)
    })
    
    // Export both sets
    generator.exportAsJson(semanticSets)
    generator.exportExtendedAsJson(extendedSets)
    
    console.log('\n✅ Done! Import in your project:')
    console.log("const semanticSets = require('./dist/simple-semantic-sets.json')")
    console.log("const extendedSets = require('./dist/extended-semantic-sets.json')")
    console.log("const { semanticSets } = semanticSets")
    console.log("const { extendedSemanticSets } = extendedSets")
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the generator
generateSemanticSets()

module.exports = { SimpleSemanticGenerator } 