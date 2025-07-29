const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { BilingualTrie } = require('./data-structures/trie');
const { BilingualMap } = require('./data-structures/map');
const { PerformanceMonitor } = require('./utils/performance');
const { MemoryAnalyzer } = require('./utils/memory-usage');
const { DataLoader } = require('./utils/data-loader');
const { SearchInterface } = require('./ui/search-interface');

/**
 * Main application class for the Bilingual Autocomplete System
 */
class AutocompleteApp {
  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.memoryAnalyzer = new MemoryAnalyzer();
    this.dataLoader = new DataLoader();
    this.trie = null;
    this.map = null;
    this.searchInterface = null;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Bilingual Autocomplete System...\n');
      
      // Load sample data
      const sampleData = await this.dataLoader.loadSampleTexts();
      console.log(`📚 Loaded ${sampleData.length} sample texts\n`);

      // Initialize data structures
      await this.initializeDataStructures(sampleData);
      
      // Initialize search interface
      this.searchInterface = new SearchInterface(
        this.trie, 
        this.map, 
        this.performanceMonitor
      );

      // Display statistics
      this.displayStatistics();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize application:', error.message);
      return false;
    }
  }

  /**
   * Initialize data structures with performance monitoring
   */
  async initializeDataStructures(sampleData) {
    // Build Trie
    const trieBuildResult = this.performanceMonitor.measureOperation(
      'trie-build', 
      () => new BilingualTrie(sampleData)
    );
    this.trie = trieBuildResult.result;
    console.log(`⏱️ Trie build time: ${trieBuildResult.duration}`);

    // Build Map
    const mapBuildResult = this.performanceMonitor.measureOperation(
      'map-build', 
      () => new BilingualMap(sampleData)
    );
    this.map = mapBuildResult.result;
    console.log(`⏱️ Map build time: ${mapBuildResult.duration}\n`);
  }

  /**
   * Display memory statistics for data structures
   */
  displayStatistics() {
    console.log('📊 Data Structure Statistics:');
    console.log('🌳 Trie Statistics:');
    this.memoryAnalyzer.analyzeMemoryUsage(this.trie, true);
    
    console.log('\n🗺️ Map Statistics:');
    this.memoryAnalyzer.analyzeMemoryUsage(this.map, false);
    console.log('');
  }

  /**
   * Start the interactive search interface
   */
  async start() {
    if (!this.searchInterface) {
      console.error('❌ Search interface not initialized');
      return;
    }

    console.log('🎯 Interactive Autocomplete System');
    console.log('Type a word to search (or "quit" to exit):\n');

    // Handle graceful shutdown
    this.setupGracefulShutdown();
    
    // Start the search interface
    await this.searchInterface.start();
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const cleanup = () => {
      console.log('\n👋 Shutting down gracefully...');
      if (this.searchInterface) {
        this.searchInterface.cleanup();
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}

/**
 * Main application entry point
 */
async function main() {
  const app = new AutocompleteApp();
  
  const initialized = await app.initialize();
  if (!initialized) {
    process.exit(1);
  }

  await app.start();
}

// Run the application if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Application failed:', error);
    process.exit(1);
  });
}

module.exports = { AutocompleteApp }; 