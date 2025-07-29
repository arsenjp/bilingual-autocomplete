const readline = require('readline');

/**
 * Interactive search interface for the autocomplete system
 * Handles user input and displays search results
 */
class SearchInterface {
  constructor(trie, map, performanceMonitor) {
    this.trie = trie;
    this.map = map;
    this.performanceMonitor = performanceMonitor;
    this.rl = null;
    this.isRunning = false;
  }

  /**
   * Initialize the readline interface
   */
  initialize() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Start the interactive search interface
   */
  async start() {
    if (!this.trie || !this.map) {
      throw new Error('Trie and Map must be initialized before starting search interface');
    }

    this.initialize();
    this.isRunning = true;

    await this.promptUser();
  }

  /**
   * Prompt user for search input
   */
  async promptUser() {
    if (!this.isRunning) return;

    this.rl.question('\n🔍 Enter search term: ', async (query) => {
      try {
        await this.handleUserInput(query);
      } catch (error) {
        console.error('❌ Error processing input:', error.message);
      }

      // Continue prompting
      if (this.isRunning) {
        await this.promptUser();
      }
    });
  }

  /**
   * Handle user input
   * @param {string} query - User's search query
   */
  async handleUserInput(query) {
    const trimmedQuery = query.trim();

    // Handle exit commands
    if (this.isExitCommand(trimmedQuery)) {
      await this.exit();
      return;
    }

    // Handle empty input
    if (trimmedQuery === '') {
      console.log('Please enter a search term.');
      return;
    }

    // Handle help command
    if (this.isHelpCommand(trimmedQuery)) {
      this.showHelp();
      return;
    }

    // Handle stats command
    if (this.isStatsCommand(trimmedQuery)) {
      this.showStats();
      return;
    }

    // Perform search
    await this.performSearch(trimmedQuery);
  }

  /**
   * Check if the query is an exit command
   * @param {string} query - User query
   * @returns {boolean} True if it's an exit command
   */
  isExitCommand(query) {
    const exitCommands = ['quit', 'exit', 'q', 'bye'];
    return exitCommands.includes(query.toLowerCase());
  }

  /**
   * Check if the query is a help command
   * @param {string} query - User query
   * @returns {boolean} True if it's a help command
   */
  isHelpCommand(query) {
    const helpCommands = ['help', 'h', '?', 'commands'];
    return helpCommands.includes(query.toLowerCase());
  }

  /**
   * Check if the query is a stats command
   * @param {string} query - User query
   * @returns {boolean} True if it's a stats command
   */
  isStatsCommand(query) {
    const statsCommands = ['stats', 'statistics', 'info'];
    return statsCommands.includes(query.toLowerCase());
  }

  /**
   * Perform search using both Trie and Map
   * @param {string} query - Search query
   */
  async performSearch(query) {
    console.log(`\nQuery: "${query}"`);
    
    try {
      // Get autocomplete suggestions
      const suggestionsResult = this.performanceMonitor.measureOperation(
        'suggestions', 
        () => this.trie.getAutocompleteSuggestions(query)
      );

      // Search Trie
      const trieSearchResult = this.performanceMonitor.measureOperation(
        'search trie', 
        () => this.trie.search(query)
      );

      // Search Map
      const mapSearchResult = this.performanceMonitor.measureOperation(
        'search map', 
        () => this.map.search(query)
      );

      // Display results
      this.displaySearchResults(
        suggestionsResult.result,
        trieSearchResult.result,
        mapSearchResult.result,
        suggestionsResult.duration,
        trieSearchResult.duration,
        mapSearchResult.duration
      );

    } catch (error) {
      console.error('❌ Search error:', error.message);
    }
  }

  /**
   * Display search results
   * @param {Array<string>} suggestions - Autocomplete suggestions
   * @param {Array<string>} trieResults - Trie search results
   * @param {Array<string>} mapResults - Map search results
   * @param {string} suggestionsTime - Suggestions timing
   * @param {string} trieTime - Trie search timing
   * @param {string} mapTime - Map search timing
   */
  displaySearchResults(suggestions, trieResults, mapResults, suggestionsTime, trieTime, mapTime) {
    if (trieResults.length === 0 && mapResults.length === 0) {
      console.log('  ❌ No results found');
    } else {
      // Display autocomplete suggestions
      if (suggestions.length > 0) {
        console.log('  💡 Autocomplete suggestions: ' + suggestions.join(', '));
      }
      
      // Display Trie results
      if (trieResults.length > 0) {
        console.log('\n  🌳 Trie Results:');
        trieResults.forEach((result, index) => {
          console.log(`    ${index + 1}. ${result}`);
        });
      }
      
      // Display Map results
      if (mapResults.length > 0) {
        console.log('\n  🗺️ Map Results:');
        mapResults.forEach((result, index) => {
          console.log(`    ${index + 1}. ${result}`);
        });
      }
    }
    
    // Display performance metrics
    console.log(`\n  ⏱️ Suggestions time: ${suggestionsTime}`);
    console.log(`  ⏱️ Trie Search time: ${trieTime}`);
    console.log(`  ⏱️ Map search time: ${mapTime}`);
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('\n📖 Available Commands:');
    console.log('  <search term>  - Search for terms (Japanese or English)');
    console.log('  help, h, ?     - Show this help message');
    console.log('  stats, info    - Show system statistics');
    console.log('  quit, exit, q  - Exit the application');
    console.log('\n💡 Tips:');
    console.log('  - Try partial matches like "海" for "海のアクティビティ"');
    console.log('  - Both Japanese and English terms are supported');
    console.log('  - Results show performance comparison between Trie and Map');
  }

  /**
   * Show system statistics
   */
  showStats() {
    console.log('\n📊 System Statistics:');
    
    // Trie statistics
    const trieStats = this.trie.getStatistics();
    console.log('  🌳 Trie:');
    console.log(`    Total terms: ${trieStats.totalTerms}`);
    console.log(`    Total texts: ${trieStats.totalTexts}`);
    console.log(`    Semantic sets: ${trieStats.semanticSets}`);
    console.log(`    Nodes: ${trieStats.nodeCount}`);
    
    // Map statistics
    const mapStats = this.map.getStatistics();
    console.log('  🗺️ Map:');
    console.log(`    Total terms: ${mapStats.totalTerms}`);
    console.log(`    Total texts: ${mapStats.totalTexts}`);
    console.log(`    Semantic sets: ${mapStats.semanticSets}`);
    console.log(`    Avg terms per set: ${mapStats.averageTermsPerSet.toFixed(2)}`);
    
    // Performance summary
    this.performanceMonitor.printSummary();
  }

  /**
   * Exit the application gracefully
   */
  async exit() {
    console.log('\n👋 Goodbye!');
    this.isRunning = false;
    this.cleanup();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  /**
   * Check if the interface is running
   * @returns {boolean} True if running
   */
  isActive() {
    return this.isRunning && this.rl !== null;
  }

  /**
   * Get interface status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasReadline: this.rl !== null,
      trieInitialized: this.trie !== null,
      mapInitialized: this.map !== null
    };
  }
}

module.exports = { SearchInterface }; 