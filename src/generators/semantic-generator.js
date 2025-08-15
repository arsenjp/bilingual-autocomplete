const fs = require('fs');
const path = require('path');
const { default: Kuroshiro } = require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
const { DataLoader } = require('../utils/data-loader');

/**
 * Semantic set generator for Japanese text processing
 * Converts Japanese text to various script forms and generates semantic sets
 */
class SemanticGenerator {
  constructor() {
    this.semanticSets = new Set();
    this.kuroshiro = null;
    this.initialized = false;
    this.dataLoader = new DataLoader();
  }

  /**
   * Initialize the Kuroshiro analyzer
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.kuroshiro = new Kuroshiro();
      await this.kuroshiro.init(new KuromojiAnalyzer());
      this.initialized = true;
      console.log('✅ Kuroshiro initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize Kuroshiro: ${error.message}`);
    }
  }

  /**
   * Convert a term to all script variations
   * @param {string} text - Text to convert
   * @returns {Object} Conversion result with key and variations
   */
  async convertToAllScripts(text) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    const variations = new Set();
    const lowerText = text.toLowerCase();
    
    // Add original text
    variations.add(lowerText);
    
    try {
      // Convert to hiragana
      const hiragana = await this.kuroshiro.convert(lowerText, { to: 'hiragana' });
      if (hiragana && hiragana !== lowerText) {
        variations.add(hiragana);
      }
      
      // Convert to katakana
      const katakana = await this.kuroshiro.convert(lowerText, { to: 'katakana' });
      if (katakana && katakana !== lowerText) {
        variations.add(katakana);
      }
    } catch (error) {
      console.warn(`⚠️ Script conversion failed for "${text}": ${error.message}`);
    }
    
    return {
      key: text,
      variations: Array.from(variations)
    };
  }

  /**
   * Extract words from text using various patterns
   * @param {string} text - Text to extract words from
   * @returns {Array<string>} Array of extracted words
   */
  async extractWords(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const words = new Set();
    
    // First split by parentheses and brackets
    const parts = this.splitByParentheses(text);
    
    // Process each part
    for (const part of parts) {
      const dotParts = part.split(/[・･]/);
      for (const dotPart of dotParts) {
        const trimmed = dotPart.trim();
        if (trimmed) {
          const subParts = trimmed.split(/[\s,、\/]+/);
          for (const subPart of subParts) {
            const finalTrimmed = subPart.trim();
            if (finalTrimmed && !this.isSingleEnglishLetter(finalTrimmed)) {
              words.add(finalTrimmed);
            }
          }
        }
      }
    }
    
    return Array.from(words);
  }

  /**
   * Split text by parentheses (both Japanese and English)
   * @param {string} text - Text to split
   * @returns {Array<string>} Array of text parts
   */
  splitByParentheses(text) {
    const parts = [];
    let currentText = text;
    
    while (currentText.includes('（') || currentText.includes('(')) {
      const jpParenIndex = currentText.indexOf('（');
      const enParenIndex = currentText.indexOf('(');
      const parenIndex = jpParenIndex === -1 ? enParenIndex : 
                        enParenIndex === -1 ? jpParenIndex :
                        Math.min(jpParenIndex, enParenIndex);
      
      const beforeParen = currentText.substring(0, parenIndex);
      const parenChar = currentText[parenIndex];
      const closingParen = parenChar === '（' ? '）' : ')';
      const closingIndex = currentText.indexOf(closingParen, parenIndex);
      
      if (closingIndex === -1) {
        // No closing parenthesis found, treat rest as one part
        parts.push(currentText);
        break;
      }
      
      const insideParen = currentText.substring(parenIndex + 1, closingIndex);
      const afterParen = currentText.substring(closingIndex + 1);
      
      if (beforeParen) parts.push(beforeParen);
      if (insideParen) parts.push(insideParen);
      currentText = afterParen;
    }
    
    if (currentText) parts.push(currentText);
    return parts;
  }

  /**
   * Check if a string is a single English letter
   * @param {string} str - String to check
   * @returns {boolean} True if it's a single English letter
   */
  isSingleEnglishLetter(str) {
    return /^[A-Za-z]$/.test(str);
  }

  /**
   * Generate semantic sets from texts
   * @param {Array<string>} texts - Array of texts to process
   * @returns {Promise<Array<Array<string>>>} Array of semantic sets
   */
  async generateSemanticSets(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    await this.initialize();
    
    const semanticMappings = new Map();
    
    console.log('🔍 Processing texts for semantic sets...');
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const progress = ((i + 1) / texts.length * 100).toFixed(1);
      console.log(`📝 Processing text ${i + 1}/${texts.length} (${progress}%): ${text.substring(0, 50)}...`);
      
      try {
        const words = await this.extractWords(text);
        
        for (const word of words) {
          const { key, variations } = await this.convertToAllScripts(word);
          
          if (!semanticMappings.has(key)) {
            semanticMappings.set(key, []);
          }
          
          // Keep the longest variation set
          if (variations.length > semanticMappings.get(key).length) {
            semanticMappings.set(key, variations);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to process text "${text}": ${error.message}`);
      }
    }
    
    return Array.from(semanticMappings.values());
  }

  /**
   * Add English terms to semantic sets using translations
   * @param {Array<Array<string>>} semanticSets - Original semantic sets
   * @param {Object} translations - Translation mappings
   * @returns {Array<Array<string>>} Enhanced semantic sets
   */
  async addEnglishTerms(semanticSets, translations) {
    if (!Array.isArray(semanticSets)) {
      throw new Error('Semantic sets must be an array');
    }

    if (!translations || typeof translations !== 'object') {
      console.warn('⚠️ No translations provided, returning original sets');
      return semanticSets;
    }

    const enhancedSets = semanticSets.map(set => {
      const enhancedSet = [...set];
      
      for (const term of set) {
        if (translations[term] && Array.isArray(translations[term])) {
          const englishTerms = translations[term].map(t => t.toLowerCase());
          enhancedSet.push(...englishTerms);
        }
      }
      
      return enhancedSet;
    });
    
    // Find untranslated terms
    const untranslatedTerms = this.findUntranslatedTerms(semanticSets, translations);
    
    // Export untranslated terms if any found
    if (untranslatedTerms.size > 0) {
      await this.exportUntranslatedTerms(untranslatedTerms);
    }
    
    return enhancedSets;
  }

  /**
   * Find untranslated Japanese terms
   * @param {Array<Array<string>>} semanticSets - Semantic sets
   * @param {Object} translations - Translation mappings
   * @returns {Map} Map of untranslated terms
   */
  findUntranslatedTerms(semanticSets, translations) {
    const untranslatedTerms = new Map();
    
    semanticSets.forEach(set => {
      // Check if any term in the set has a translation
      const hasTranslation = set.some(term => 
        translations[term] && translations[term].length > 0
      );
      
      if (!hasTranslation) {
        // Check if set contains any Japanese terms
        const hasJapaneseTerm = set.some(term => 
          /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(term)
        );
        
        if (!hasJapaneseTerm) {
          return; // Skip this set as it contains no Japanese terms
        }
        
        // Find the best representative term
        const representativeTerm = this.findRepresentativeTerm(set);
        if (representativeTerm) {
          untranslatedTerms.set(representativeTerm, []);
        }
      }
    });
    
    return untranslatedTerms;
  }

  /**
   * Find the best representative term from a semantic set
   * @param {Array<string>} set - Semantic set
   * @returns {string|null} Representative term or null
   */
  findRepresentativeTerm(set) {
    // First try to find a kanji term
    const kanjiTerm = set.find(term => /[\u4e00-\u9faf]/.test(term));
    if (kanjiTerm) return kanjiTerm;
    
    // If no kanji, find the katakana term
    const katakanaTerm = set.find(term => /^[\u30a0-\u30ff]+$/.test(term));
    if (katakanaTerm) return katakanaTerm;
    
    // If no katakana, use the first Japanese term
    const japaneseTerm = set.find(term => 
      /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(term)
    );
    
    return japaneseTerm || null;
  }

  /**
   * Export untranslated terms to JSON file
   * @param {Map} untranslatedTerms - Map of untranslated terms
   */
  async exportUntranslatedTerms(untranslatedTerms) {
    try {
      const untranslatedObj = Object.fromEntries(untranslatedTerms);
      const outputPath = path.join('dist', 'suggested-translations.json');
      
      await this.dataLoader.saveJsonFile(outputPath, untranslatedObj, 'untranslated terms');
      console.log(`📝 Exported ${untranslatedTerms.size} untranslated terms for translation`);
    } catch (error) {
      console.error('❌ Failed to export untranslated terms:', error.message);
    }
  }

  /**
   * Export semantic sets to JSON file
   * @param {Array<Array<string>>} semanticSets - Semantic sets to export
   * @param {string} filename - Output filename
   */
  async exportSemanticSets(semanticSets, filename = 'simple-semantic-sets.json') {
    if (!Array.isArray(semanticSets)) {
      throw new Error('Semantic sets must be an array');
    }

    const outputPath = path.join('dist', filename);
    
    // Check if existing file exists and load it
    let existingSets = [];
    let existingData = null;
    
    try {
      if (fs.existsSync(outputPath)) {
        console.log(`📂 Found existing file: ${filename}`);
        existingData = await this.dataLoader.loadJsonFile(outputPath);
        existingSets = existingData.semanticSets || [];
        console.log(`📊 Loaded ${existingSets.length} existing semantic sets`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load existing file: ${error.message}`);
    }

    // Merge new sets with existing ones, preserving existing terms
    const mergedSets = this.mergeSemanticSets(existingSets, semanticSets);
    
    const data = {
      generatedAt: new Date().toISOString(),
      totalSets: mergedSets.length,
      semanticSets: mergedSets
    };
    
    try {
      await this.dataLoader.saveJsonFile(outputPath, data, 'semantic sets');
      console.log(`📊 Exported ${mergedSets.length} semantic sets (${semanticSets.length} new, ${existingSets.length} preserved)`);
    } catch (error) {
      throw new Error(`Failed to export semantic sets: ${error.message}`);
    }
  }

  /**
   * Merge new semantic sets with existing ones, preserving existing terms
   * @param {Array<Array<string>>} existingSets - Existing semantic sets
   * @param {Array<Array<string>>} newSets - New semantic sets to merge
   * @returns {Array<Array<string>>} Merged semantic sets
   */
  mergeSemanticSets(existingSets, newSets) {
    if (!Array.isArray(existingSets) || existingSets.length === 0) {
      return newSets;
    }

    if (!Array.isArray(newSets) || newSets.length === 0) {
      return existingSets;
    }

    // Create a map of existing terms for quick lookup
    const existingTermsMap = new Map();
    existingSets.forEach((set, index) => {
      set.forEach(term => {
        existingTermsMap.set(term.toLowerCase(), { setIndex: index, originalTerm: term });
      });
    });

    const mergedSets = [...existingSets];
    let skippedCount = 0;
    let newSetsCount = 0;

    newSets.forEach(newSet => {
      // Check if ANY term in the new set already exists
      const hasAnyExistingTerm = newSet.some(newTerm => 
        existingTermsMap.has(newTerm.toLowerCase())
      );

      if (hasAnyExistingTerm) {
        // Skip this entire set if any term already exists
        skippedCount++;
        return;
      }

      // If no terms exist, add the entire new set as-is
      mergedSets.push([...newSet]);
      newSetsCount++;
    });

    console.log(`📈 Merge summary: ${skippedCount} sets skipped (contained existing terms), ${newSetsCount} new sets added`);
    return mergedSets;
  }

  /**
   * Generate semantic sets from input data
   * @returns {Promise<void>}
   */
  async generateFromInput() {
    try {
      console.log('🚀 Starting semantic set generation...\n');
      
      // Load input data
      const sampleTexts = await this.dataLoader.loadSampleTexts();
      const translations = await this.dataLoader.loadTranslations();
      
      console.log(`📝 Processing ${sampleTexts.length} texts...`);
      console.log(`🌐 Loaded ${Object.keys(translations).length} translations\n`);
      
      // Generate semantic sets
      let semanticSets = await this.generateSemanticSets(sampleTexts);
      
      console.log(`\n📊 Generated ${semanticSets.length} semantic sets`);
      
      // Add English terms
      semanticSets = await this.addEnglishTerms(semanticSets, translations);
      
      // Display sample sets
      this.displaySampleSets(semanticSets);
      
      // Export sets
      await this.exportSemanticSets(semanticSets);
      
      console.log('\n✅ Semantic set generation completed successfully!');
      
    } catch (error) {
      console.error('❌ Semantic set generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Display sample semantic sets
   * @param {Array<Array<string>>} semanticSets - Semantic sets to display
   */
  displaySampleSets(semanticSets) {
    console.log('\n🔗 Sample Semantic Sets:');
    const sampleCount = Math.min(5, semanticSets.length);
    
    for (let i = 0; i < sampleCount; i++) {
      const set = semanticSets[i];
      console.log(`  Set ${i + 1}: [${set.join(', ')}]`);
    }
    
    if (semanticSets.length > sampleCount) {
      console.log(`  ... and ${semanticSets.length - sampleCount} more sets`);
    }
  }

  /**
   * Get generator statistics
   * @returns {Object} Generator statistics
   */
  getStatistics() {
    return {
      initialized: this.initialized,
      semanticSetsCount: this.semanticSets.size,
      hasKuroshiro: this.kuroshiro !== null
    };
  }
}

/**
 * Main function to run semantic set generation
 */
async function main() {
  const generator = new SemanticGenerator();
  
  try {
    await generator.generateFromInput();
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

// Run the generator if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { SemanticGenerator }; 