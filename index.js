const fs = require('fs')
const path = require('path')
const { BilingualTrie } = require('./trie')

// Load sample texts from JSON file
const sampleTextsPath = path.join('input', 'sample-texts.json')
const sampleData = JSON.parse(fs.readFileSync(sampleTextsPath, 'utf8'))

console.log('📚 Loaded sample texts:', sampleData.length, 'entries')

// Create and build the trie
const trie = new BilingualTrie(sampleData)

// Test autocomplete andsearches
const testQueries = [
  '','oki','Oki', 'おき', '沖', 'オキ',
  'tok','tokyo','東','東京','とう','とうきょう', 'トウ','トウ',
  'Usj', 
  'fuji', '富士',  'ふじ', '素', 'snow', "sup", "サップ", "bus","バス",
]

console.log('\n💡 Autocomplete Suggestions and 🔍 Search Results:')
testQueries.forEach(query => {
  console.log(`\nQuery: "${query}"`)
  const suggestions = trie.getAutocompleteSuggestions(query)
  const results = trie.search(query)
  if (results.length === 0) {
    console.log('  No results found')
  } else {
    console.log('  ' + suggestions.join(', '))
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result}`)
    })
  }
})

// Show statistics
console.log('\n📊 Trie Statistics:')
const stats = trie.getStats()
console.log(`  Total Nodes: ${stats.totalNodes}`)
console.log(`  Max Depth: ${stats.maxDepth}`)
console.log(`  Total Terms: ${stats.totalTerms}`)
console.log(`  Total Mappings: ${stats.totalMappings}`)
console.log(`  Semantic Sets: ${stats.semanticSets}`)

// Print the trie structure
// trie.printTrie() 