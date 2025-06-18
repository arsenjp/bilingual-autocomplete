const fs = require('fs')
const path = require('path')

class BilingualTrie {
  constructor(data) {
    this.root = this.createNode()
    this.data = data
    this.termMappings = new Map()
    this.termToTextIndices = new Map()
    this.semanticSets = []
    this.loadSemanticSets()
    this.buildTrie()
  }

  createNode() {
    return {
      children: new Map(),
      isEnd: false,
      textIndices: new Set(),
      completeTerm: undefined
    }
  }

  loadSemanticSets() {
    try {
      const simpleSetsPath = path.join('dist', 'simple-semantic-sets.json')
      const extendedSetsPath = path.join('dist', 'extended-semantic-sets.json')
      
      const simpleData = JSON.parse(fs.readFileSync(simpleSetsPath, 'utf8'))
      const extendedData = JSON.parse(fs.readFileSync(extendedSetsPath, 'utf8'))
      
      // Get sets from simple data
      const simpleSets = simpleData.nounAdjectiveSemanticSets || simpleData.semanticSets
      
      // Get sets from extended data - note the different key name
      const extendedSets = extendedData.extendedSemanticSets || []
      
      this.semanticSets = [...simpleSets, ...extendedSets]
      console.log(`Loaded ${this.semanticSets.length} semantic sets (${simpleSets.length} simple + ${extendedSets.length} extended)`)
      

    } catch (error) {
      console.error('Error loading semantic sets:', error)
      this.semanticSets = []
    }
  }

  buildTrie() {
    // First build semantic mappings from the sets
    const semanticMappings = new Map()
    this.semanticSets.forEach(set => {
      set.forEach(term => {
        semanticMappings.set(term, set)
      })
    })
    
    // Process the text data
    this.data.forEach((text, index) => {
      // For each semantic set, check if any of its terms appear in the text
      this.semanticSets.forEach(set => {
        // Only add terms that actually match the text
        set.forEach(term => {
          const termLower = term.toLowerCase()
          const textLower = text.toLowerCase()
          
          if (textLower.includes(termLower)) {
            // Insert only the complete term
            this.insertTerm(term, index)
          }
        })
      })
    })

    // Insert all terms from semantic sets
    this.semanticSets.forEach(set => {
      set.forEach(term => {
        // Insert only the complete term
        this.insertTerm(term, -1) // Use -1 as a special index for semantic set terms
      })
    })
  }

  insertTerm(term, textIndex) {
    let node = this.root
    const termLower = term.toLowerCase()
    
    for (let i = 0; i < termLower.length; i++) {
      const char = termLower[i]
      
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode())
      }
      
      node = node.children.get(char)
      node.textIndices.add(textIndex)
    }
    
    node.isEnd = true
    node.completeTerm = term  // Store original case in completeTerm
    
    if (!this.termToTextIndices.has(term)) {
      this.termToTextIndices.set(term, new Set())
    }
    this.termToTextIndices.get(term).add(textIndex)
  }

  getScriptType(term) {
    if (/^[a-zA-Z]+$/.test(term)) return 'english'
    if (/^[\u4e00-\u9faf]+$/.test(term)) return 'kanji'
    if (/^[\u3040-\u309f]+$/.test(term)) return 'hiragana'
    if (/^[\u30a0-\u30ff]+$/.test(term)) return 'katakana'
    return 'unknown'
  }

  search(query) {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    const matchingSets = new Set()
    
    // Find all terms in all semantic sets that start with the query
    this.semanticSets.forEach(set => {
      set.forEach(term => {
        if (term.toLowerCase().startsWith(lowerQuery)) {
          matchingSets.add(set)
        }
      })
    })

    // If no matches found in semantic sets, try direct trie search
    if (matchingSets.size === 0) {
      const matchedTextIndices = new Set()
      this.searchInTrie(lowerQuery, matchedTextIndices)
      return Array.from(matchedTextIndices)
        .filter(idx => idx !== -1) // Filter out semantic set terms
        .sort((a, b) => a - b)
        .map(idx => this.data[idx])
    }

    // Collect all text indices for all terms in the matching sets
    const resultIndices = new Set()
    matchingSets.forEach(set => {
      set.forEach(term => {
        if (this.termToTextIndices && this.termToTextIndices.has(term)) {
          this.termToTextIndices.get(term).forEach(idx => {
            if (idx !== -1) { // Only include actual text matches
              resultIndices.add(idx)
            }
          })
        }
      })
    })

    // Return the texts in the order of their indices
    return Array.from(resultIndices).sort((a, b) => a - b).map(idx => this.data[idx])
  }

  searchInTrie(query, matchedTextIndices) {
    let node = this.root
    
    // Traverse the trie following the query characters
    for (let i = 0; i < query.length; i++) {
      const char = query[i]
      if (!node.children.has(char)) {
        return
      }
      node = node.children.get(char)
    }
    
    // Collect all text indices from this node and its children
    this.collectAllTextIndices(node, matchedTextIndices)
  }

  collectAllTextIndices(node, result) {
    // Add indices from this node
    if (node.isEnd) {
      node.textIndices.forEach(idx => result.add(idx))
    }
    
    // Recursively collect indices from all children
    node.children.forEach(child => {
      this.collectAllTextIndices(child, result)
    })
  }

  getAutocompleteSuggestions(query) {
    if (!query.trim()) return []
    
    const suggestions = new Set()
    this.findCompletions(query.toLowerCase(), suggestions)
    return Array.from(suggestions)
  }

  findCompletions(query, suggestions) {
    let node = this.root
    
    for (let i = 0; i < query.length; i++) {
      const char = query[i]
      if (!node.children.has(char)) {
        return
      }
      node = node.children.get(char)
    }
    
    this.collectCompletions(node, suggestions)
  }

  collectCompletions(node, suggestions) {
    // Only add complete terms
    if (node.isEnd && node.completeTerm) {
      suggestions.add(node.completeTerm)
    }
    
    // Recursively collect completions from all children
    node.children.forEach(child => {
      this.collectCompletions(child, suggestions)
    })
  }

  getStats() {
    let totalNodes = 0
    let maxDepth = 0
    
    const countNodes = (node, depth) => {
      totalNodes++
      maxDepth = Math.max(maxDepth, depth)
      
      node.children.forEach(child => {
        countNodes(child, depth + 1)
      })
    }
    
    countNodes(this.root, 0)
    
    return {
      totalNodes,
      maxDepth,
      totalTerms: this.termToTextIndices.size,
      totalMappings: this.termMappings.size,
      semanticSets: this.semanticSets.length
    }
  }

  showMappings() {
    console.log('\nTerm Mappings:')
    this.termMappings.forEach((mappedTerms, term) => {
      console.log(`${term} -> [${Array.from(mappedTerms).join(', ')}]`)
    })
    
    console.log('\nTerm to Text Indices:')
    this.termToTextIndices.forEach((indices, term) => {
      console.log(`${term} -> [${Array.from(indices).join(', ')}]`)
    })
  }

  printTrie() {
    console.log('\n🌳 Trie Structure:')
    this._printNode(this.root)
  }

  _printNode(node, prefix = '', isLast = true) {
    const marker = isLast ? '└── ' : '├── '
    console.log(prefix + marker + (node.isEnd ? '● ' : '○ ') + (node.completeTerm || ''))
    
    const children = Array.from(node.children.entries())
    children.forEach(([char, child], index) => {
      const newPrefix = prefix + (isLast ? '    ' : '│   ')
      this._printNode(child, newPrefix, index === children.length - 1)
    })
  }
}

// Export class for use as module
module.exports = { BilingualTrie }