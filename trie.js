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
      completeTerm: null
    }
  }

  loadSemanticSets() {
    try {
      const simpleSetsPath = path.join('dist', 'simple-semantic-sets.json')
      const simpleData = JSON.parse(fs.readFileSync(simpleSetsPath, 'utf8'))
      this.semanticSets = simpleData.semanticSets.map(set => 
        set.map(term => term.toLowerCase())
      )
      console.log(`Loaded ${this.semanticSets.length} semantic sets`)
    } catch (error) {
      console.error('Error loading semantic sets:', error)
      this.semanticSets = []
    }
  }

  buildTrie() {
    // Build semantic mappings from the sets
    this.semanticSets.forEach(set => {
      set.forEach(term => {
        this.termMappings.set(term, set)
      })
    })
    
    // Process the text data - convert to lowercase during build stage
    this.data.forEach((text, index) => {
      const textLower = text.toLowerCase() // Convert once during build
      this.semanticSets.forEach(set => {
        set.forEach(term => {
          if (this.termMappings.get(term).some(t => textLower.includes(t))) {
            this.insertTerm(term, index)
          }
        })
      })
    })
  }

  insertTerm(term, textIndex) {
    let node = this.root
    
    for (const char of term) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode())
      }
      node = node.children.get(char)
    }
    
    node.isEnd = true
    node.completeTerm = term
    
    if (!this.termToTextIndices.has(term)) {
      this.termToTextIndices.set(term, new Set())
    }
    this.termToTextIndices.get(term).add(textIndex)
  }

  search(query) {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    const matchedTextIndices = new Set()

    const autocompleteSuggestions = this.getAutocompleteSuggestions(lowerQuery)

    autocompleteSuggestions.forEach(term => {
      this.termToTextIndices.get(term).forEach(idx => {
        matchedTextIndices.add(idx)
      })
    })

    return Array.from(matchedTextIndices)
      .sort((a, b) => a - b)
      .map(idx => this.data[idx])
  }

  getAutocompleteSuggestions(query) {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    
    const suggestions = new Set()
    this.findCompletions(lowerQuery, suggestions)
    return Array.from(suggestions)
  }

  findCompletions(query, suggestions) {
    let node = this.root
    
    for (const char of query) {
      if (!node.children.has(char)) return
      node = node.children.get(char)
    }
    
    this.collectCompletions(node, suggestions)
  }

  collectCompletions(node, suggestions) {
    if (node.isEnd && node.completeTerm) {
      suggestions.add(node.completeTerm)
    }
    
    node.children.forEach(child => {
      this.collectCompletions(child, suggestions)
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

module.exports = { BilingualTrie }