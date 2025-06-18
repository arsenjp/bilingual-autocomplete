const fs = require('fs')
const path = require('path')

class BilingualMap {
  constructor(data) {
    this.data = data
    this.termMappings = new Map()
    this.termToTextIndices = new Map()
    this.semanticSets = []
    this.loadSemanticSets()
    this.buildMap()
  }

  loadSemanticSets() {
    try {
      const simpleSetsPath = path.join('dist', 'simple-semantic-sets.json')
      
      const simpleData = JSON.parse(fs.readFileSync(simpleSetsPath, 'utf8'))
      
      // Convert all terms to lowercase during build stage
      this.semanticSets = simpleData.semanticSets.map(set => 
        set.map(term => term.toLowerCase())
      )
      
      console.log(`Loaded ${this.semanticSets.length} semantic sets `)
      

    } catch (error) {
      console.error('Error loading semantic sets:', error)
      this.semanticSets = []
    }
  }

  buildMap() {
    // Process the text data - convert to lowercase during build stage
    this.data.forEach((text, index) => {
      const textLower = text.toLowerCase() // Convert once during build
      // For each semantic set, check if any of its terms appear in the text
      this.semanticSets.forEach(set => {
        // Only add terms that actually match the text
        set.forEach(term => {
          // No need for toLowerCase() since both term and text are already lowercase
          if (textLower.includes(term)) {
            // Insert only the complete term
            if (!this.termToTextIndices.has(term)) {
                this.termToTextIndices.set(term, new Set())
              }
              this.termToTextIndices.get(term).add(index)
            }
        })
      })
    })

  }

  search(query) {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    const matchingSets = new Set()
    
    // Find all terms in all semantic sets that start with the query
    this.semanticSets.forEach(set => {
      set.forEach(term => {
        // No need for toLowerCase() since term is already lowercase from semantic sets
        if (term.startsWith(lowerQuery)) {
          matchingSets.add(set)
        }
      })
    })

    // Collect all text indices for all terms in the matching sets
    const resultIndices = new Set()
    matchingSets.forEach(set => {
      set.forEach(term => {
        if (this.termToTextIndices && this.termToTextIndices.has(term)) {
          this.termToTextIndices.get(term).forEach(idx => {
              resultIndices.add(idx)
          })
        }
      })
    })

    // Return the texts in the order of their indices (original, non-lowercase version)
    return Array.from(resultIndices).sort((a, b) => a - b).map(idx => this.data[idx])
  }
}

// Export class for use as module
module.exports = { BilingualMap }