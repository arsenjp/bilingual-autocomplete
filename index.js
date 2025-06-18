const fs = require('fs')
const path = require('path')
const { BilingualTrie } = require('./trie')
const { BilingualMap } = require('./map')
const performance = require('./performance')
const memoryUsage = require('./memory-usage')

// Load sample texts from JSON file
const sampleTextsPath = path.join('input', 'sample-texts.json')
const sampleData = JSON.parse(fs.readFileSync(sampleTextsPath, 'utf8'))

console.log('📚 Loaded sample texts:', sampleData.length, 'entries')

// Create and build the trie with timing
const trieBuildResult = performance.measureOperation('trie-build', () => new BilingualTrie(sampleData))
const trie = trieBuildResult.result
console.log(`\n⏱️ Trie build time: ${trieBuildResult.duration}`)


// Create and build the map with timing
const mapBuildResult = performance.measureOperation('map-build', () => new BilingualMap(sampleData))
const map = mapBuildResult.result
console.log(`\n⏱️ Map build time: ${mapBuildResult.duration}`)

// Test autocomplete and searches
const testQueries = [
  '','oki','Oki', 'おき', '沖', 'オキ',
  'tok','tokyo','東','東京','とう','とうきょう', 'トウ','トウ',
  'Usj', 
  'fuji', '富士',  'ふじ', '素', 'snow',"雪", "sup", "サップ", "bus","バス", "trekking", "horse", "race", "Bbq"
]

console.log('\n💡 Autocomplete Suggestions and 🔍 Search Results:')
testQueries.forEach(query => {
  console.log(`\nQuery: "${query}"`)
  
  const suggestionsResult = performance.measureOperation('suggestions', () => 
    trie.getAutocompleteSuggestions(query)
  )
  const trieSearchResult = performance.measureOperation('search trie', () => 
    trie.search(query)
  )

  const mapSearchResult = performance.measureOperation('search map', () =>
    map.search(query)
  )
  
  const suggestions = suggestionsResult.result
  const trieResults = trieSearchResult.result
  const mapResults = mapSearchResult.result
  
  if (trieResults.length === 0 || mapResults.length === 0) {
    console.log('  No results found')
  } else {
    console.log('  ' + suggestions.join(', '))
    console.log('\n  Trie Results:')
    trieResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result}`)
    })
    console.log('\n  Map Results:')
    mapResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result}`)
    })
  }
  console.log(`\n  ⏱️ Suggestions time: ${suggestionsResult.duration}`)
  console.log(`  ⏱️ Trie Search time: ${trieSearchResult.duration}`)
  console.log(`  ⏱️ Map search time: ${mapSearchResult.duration}`)
})

// Get statistics from the trie
console.log('\n📊 Trie Statistics:')
memoryUsage.getMemoryUsage(trie, true)
// Get statistics from the map
console.log('\n📊 Map Statistics:')
memoryUsage.getMemoryUsage(map, false)

// Print the trie structure
// trie.printTrie()