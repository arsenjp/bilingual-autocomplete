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
    const lowerText = text.toLowerCase()
    
    // Add original text
    variations.add(lowerText)
    
    // Convert to hiragana
    const hiragana = await this.kuroshiro.convert(lowerText, { to: 'hiragana' })
    variations.add(hiragana)
    
    // Convert to katakana
    const katakana = await this.kuroshiro.convert(lowerText, { to: 'katakana' })
    variations.add(katakana)
    
    return {
      key: katakana || lowerText,
      variations: Array.from(variations)
    }
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
    
    const semanticMappings = new Map()
    
    console.log('Processing texts for semantic sets...')
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      console.log(`Processing text ${i + 1}/${texts.length}: ${text.substring(0, 50)}...`)
      
      const words = await this.extractWords(text)
      
      for (const word of words) {
        const { key, variations } = await this.convertToAllScripts(word)
        console.log(`  Found variations for "${word}":`, variations)

        console.log(`  Adding "${key}" with variations:`, variations)
        if (!semanticMappings.has(key)) {
          semanticMappings.set(key, [])
        }
        if (variations.length > semanticMappings.get(key).length) {
          semanticMappings.set(key, variations)
        }
      }
    }
    
    return Array.from(semanticMappings.values())
  }

  async addEnglishTerms(semanticSets, translations) {
    const enhancedSets = semanticSets.map(set => {
      const enhancedSet = [...set]
      for (const term of set) {
        if (translations[term]) {
          console.log("adding english term", term, translations[term])
          enhancedSet.push(...translations[term].map(t => t.toLowerCase()))
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
      const outputPath = path.join('dist', 'suggested-translations.json')
      fs.writeFileSync(outputPath, JSON.stringify(untranslatedObj, null, 2), 'utf8')
      console.log(`\n📝 Exported ${untranslatedTerms.size} untranslated terms to ${outputPath}`)
    }
    
    return enhancedSets
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
    
    // Add English terms to both sets
    semanticSets = await generator.addEnglishTerms(semanticSets, translations, false)
    
    console.log('\n🔗 Semantic sets:')
    semanticSets.forEach((set, index) => {
      console.log(`  Set ${index + 1}: [${set.join(', ')}]`)
    })
    
    // Export both sets
    generator.exportAsJson(semanticSets)
    
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