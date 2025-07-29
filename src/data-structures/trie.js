const fs = require('fs');
const path = require('path');

/**
 * Node structure for the Trie data structure
 */
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEnd = false;
    this.completeTerm = null;
  }
}

/**
 * Bilingual Trie implementation for efficient prefix-based search
 * Supports Japanese and English text with semantic set integration
 */
class BilingualTrie {
  constructor(data = []) {
    this.root = new TrieNode();
    this.data = data;
    this.termMappings = new Map();
    this.termToTextIndices = new Map();
    this.semanticSets = [];
    
    this.initialize();
  }

  /**
   * Initialize the trie with data and semantic sets
   */
  initialize() {
    try {
      this.loadSemanticSets();
      this.buildTrie();
    } catch (error) {
      console.error('❌ Failed to initialize BilingualTrie:', error.message);
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
   * Build the trie structure from data and semantic sets
   */
  buildTrie() {
    if (!this.data || this.data.length === 0) {
      console.warn('⚠️ No data provided for trie construction');
      return;
    }

    this.data.forEach((text, index) => {
      const textLower = text.toLowerCase();
      
      this.semanticSets.forEach(set => {
        if (set.some(term => textLower.includes(term))) {
          set.forEach(term => {
            this.insertTerm(term, index);
          });
        }
      });
    });

    console.log(`🌳 Built trie with ${this.termToTextIndices.size} unique terms`);
  }

  /**
   * Insert a term into the trie
   * @param {string} term - The term to insert
   * @param {number} textIndex - Index of the text in the data array
   */
  insertTerm(term, textIndex) {
    if (!term || typeof term !== 'string') {
      return;
    }

    let node = this.root;
    
    for (const char of term) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }
    
    node.isEnd = true;
    node.completeTerm = term;
    
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
    const matchedTextIndices = new Set();
    const autocompleteSuggestions = this.getAutocompleteSuggestions(lowerQuery);

    autocompleteSuggestions.forEach(term => {
      const textIndices = this.termToTextIndices.get(term);
      if (textIndices) {
        textIndices.forEach(idx => {
          matchedTextIndices.add(idx);
        });
      }
    });

    return Array.from(matchedTextIndices)
      .sort((a, b) => a - b)
      .map(idx => this.data[idx]);
  }

  /**
   * Get autocomplete suggestions for a query
   * @param {string} query - Search query
   * @returns {Array<string>} Array of autocomplete suggestions
   */
  getAutocompleteSuggestions(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }
    
    const suggestions = new Set();
    this.findCompletions(query, suggestions);
    return Array.from(suggestions);
  }

  /**
   * Find completions for a given query
   * @param {string} query - Search query
   * @param {Set} suggestions - Set to store suggestions
   */
  findCompletions(query, suggestions) {
    let node = this.root;
    
    // Navigate to the node corresponding to the query
    for (const char of query) {
      if (!node.children.has(char)) {
        return; // Query not found in trie
      }
      node = node.children.get(char);
    }
    
    // Collect all completions from this node
    this.collectCompletions(node, suggestions);
  }

  /**
   * Recursively collect all completions from a node
   * @param {TrieNode} node - Current node
   * @param {Set} suggestions - Set to store suggestions
   */
  collectCompletions(node, suggestions) {
    if (node.isEnd && node.completeTerm) {
      suggestions.add(node.completeTerm);
    }
    
    node.children.forEach(child => {
      this.collectCompletions(child, suggestions);
    });
  }

  /**
   * Get statistics about the trie
   * @returns {Object} Trie statistics
   */
  getStatistics() {
    return {
      totalTerms: this.termToTextIndices.size,
      totalTexts: this.data.length,
      semanticSets: this.semanticSets.length,
      nodeCount: this.countNodes(this.root)
    };
  }

  /**
   * Count total nodes in the trie
   * @param {TrieNode} node - Current node
   * @returns {number} Total node count
   */
  countNodes(node) {
    let count = 1; // Count current node
    node.children.forEach(child => {
      count += this.countNodes(child);
    });
    return count;
  }

  /**
   * Print the trie structure (for debugging)
   */
  printTrie() {
    console.log('\n🌳 Trie Structure:');
    this._printNode(this.root);
  }

  /**
   * Recursively print trie nodes
   * @param {TrieNode} node - Current node
   * @param {string} prefix - Prefix for indentation
   * @param {boolean} isLast - Whether this is the last child
   */
  _printNode(node, prefix = '', isLast = true) {
    const marker = isLast ? '└── ' : '├── ';
    const nodeSymbol = node.isEnd ? '● ' : '○ ';
    const term = node.completeTerm || '';
    
    console.log(prefix + marker + nodeSymbol + term);
    
    const children = Array.from(node.children.entries());
    children.forEach(([char, child], index) => {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      this._printNode(child, newPrefix, index === children.length - 1);
    });
  }
}

module.exports = { BilingualTrie, TrieNode }; 