const fs = require('fs');
const path = require('path');

/**
 * Bilingual Map implementation for direct term-to-text mapping
 * Provides fast lookup performance for semantic set matching
 */
class BilingualMap {
  constructor(data = []) {
    this.data = data;
    this.termMappings = new Map();
    this.termToTextIndices = new Map();
    this.semanticSets = [];
    
    this.initialize();
  }

  /**
   * Initialize the map with data and semantic sets
   */
  initialize() {
    try {
      this.loadSemanticSets();
      this.buildMap();
    } catch (error) {
      console.error('❌ Failed to initialize BilingualMap:', error.message);
      throw error;
    }
  }

  /**
   * Load semantic sets from JSON file
   */
  loadSemanticSets() {
    try {
      const simpleSetsPath = path.join('dist', 'simple-semantic-sets.json');
      
      if (!fs.existsSync(simpleSetsPath)) {
        console.warn('⚠️ Semantic sets file not found. Run semantic generator first.');
        this.semanticSets = [];
        return;
      }

      const simpleData = JSON.parse(fs.readFileSync(simpleSetsPath, 'utf8'));
      
      // Convert all terms to lowercase during build stage
      this.semanticSets = simpleData.semanticSets.map(set => 
        set.map(term => term.toLowerCase())
      );
      
      console.log(`📚 Loaded ${this.semanticSets.length} semantic sets`);
    } catch (error) {
      console.error('❌ Error loading semantic sets:', error.message);
      this.semanticSets = [];
    }
  }

  /**
   * Build the map structure from data and semantic sets
   */
  buildMap() {
    if (!this.data || this.data.length === 0) {
      console.warn('⚠️ No data provided for map construction');
      return;
    }

    // Process the text data - convert to lowercase during build stage
    this.data.forEach((text, index) => {
      const textLower = text.toLowerCase(); // Convert once during build
      
      // For each semantic set, check if any of its terms appear in the text
      this.semanticSets.forEach(set => {
        // Only add terms that actually match the text
        set.forEach(term => {
          // No need for toLowerCase() since both term and text are already lowercase
          if (textLower.includes(term)) {
            this.addTermMapping(term, index);
          }
        });
      });
    });

    console.log(`🗺️ Built map with ${this.termToTextIndices.size} unique terms`);
  }

  /**
   * Add a term mapping to the map
   * @param {string} term - The term to map
   * @param {number} textIndex - Index of the text in the data array
   */
  addTermMapping(term, textIndex) {
    if (!term || typeof term !== 'string') {
      return;
    }

    if (!this.termToTextIndices.has(term)) {
      this.termToTextIndices.set(term, new Set());
    }
    this.termToTextIndices.get(term).add(textIndex);
  }

  /**
   * Search for texts matching the query
   * @param {string} query - Search query
   * @returns {Array<string>} Array of matching texts
   */
  search(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const matchingSets = new Set();
    
    // Find all terms in all semantic sets that start with the query
    this.semanticSets.forEach(set => {
      set.forEach(term => {
        // No need for toLowerCase() since term is already lowercase from semantic sets
        if (term.startsWith(lowerQuery)) {
          matchingSets.add(set);
        }
      });
    });

    // Collect all text indices for all terms in the matching sets
    const resultIndices = new Set();
    matchingSets.forEach(set => {
      set.forEach(term => {
        if (this.termToTextIndices && this.termToTextIndices.has(term)) {
          this.termToTextIndices.get(term).forEach(idx => {
            resultIndices.add(idx);
          });
        }
      });
    });

    // Return the texts in the order of their indices (original, non-lowercase version)
    return Array.from(resultIndices)
      .sort((a, b) => a - b)
      .map(idx => this.data[idx]);
  }

  /**
   * Get all terms that start with the given prefix
   * @param {string} prefix - The prefix to search for
   * @returns {Array<string>} Array of matching terms
   */
  getTermsByPrefix(prefix) {
    if (!prefix || typeof prefix !== 'string' || !prefix.trim()) {
      return [];
    }

    const lowerPrefix = prefix.toLowerCase();
    const matchingTerms = new Set();

    this.semanticSets.forEach(set => {
      set.forEach(term => {
        if (term.startsWith(lowerPrefix)) {
          matchingTerms.add(term);
        }
      });
    });

    return Array.from(matchingTerms);
  }

  /**
   * Get all semantic sets containing a specific term
   * @param {string} term - The term to search for
   * @returns {Array<Array<string>>} Array of semantic sets containing the term
   */
  getSemanticSetsForTerm(term) {
    if (!term || typeof term !== 'string' || !term.trim()) {
      return [];
    }

    const lowerTerm = term.toLowerCase();
    return this.semanticSets.filter(set => 
      set.some(setTerm => setTerm === lowerTerm)
    );
  }

  /**
   * Get statistics about the map
   * @returns {Object} Map statistics
   */
  getStatistics() {
    return {
      totalTerms: this.termToTextIndices.size,
      totalTexts: this.data.length,
      semanticSets: this.semanticSets.length,
      averageTermsPerSet: this.semanticSets.length > 0 
        ? this.semanticSets.reduce((sum, set) => sum + set.length, 0) / this.semanticSets.length 
        : 0
    };
  }

  /**
   * Check if a term exists in the map
   * @param {string} term - The term to check
   * @returns {boolean} True if the term exists
   */
  hasTerm(term) {
    if (!term || typeof term !== 'string') {
      return false;
    }
    return this.termToTextIndices.has(term.toLowerCase());
  }

  /**
   * Get all texts associated with a specific term
   * @param {string} term - The term to look up
   * @returns {Array<string>} Array of associated texts
   */
  getTextsForTerm(term) {
    if (!term || typeof term !== 'string' || !this.hasTerm(term)) {
      return [];
    }

    const lowerTerm = term.toLowerCase();
    const textIndices = this.termToTextIndices.get(lowerTerm);
    
    if (!textIndices) {
      return [];
    }

    return Array.from(textIndices)
      .sort((a, b) => a - b)
      .map(idx => this.data[idx]);
  }

  /**
   * Get all unique terms in the map
   * @returns {Array<string>} Array of all terms
   */
  getAllTerms() {
    return Array.from(this.termToTextIndices.keys());
  }

  /**
   * Clear all data from the map
   */
  clear() {
    this.termMappings.clear();
    this.termToTextIndices.clear();
    this.semanticSets = [];
    this.data = [];
  }
}

module.exports = { BilingualMap }; 