const v8 = require('v8');

/**
 * Memory usage analyzer for data structures
 * Provides detailed memory consumption analysis using V8 serialization
 */
class MemoryAnalyzer {
  constructor() {
    this.measurements = new Map();
  }

  /**
   * Get the V8 serialized size of an object
   * @param {*} obj - Object to measure
   * @returns {number|null} Size in bytes or null if serialization fails
   */
  getObjectV8Size(obj) {
    if (obj === null || obj === undefined) {
      return 0;
    }

    try {
      return v8.serialize(obj).length;
    } catch (error) {
      console.warn('⚠️ V8 serialization failed:', error.message);
      return null;
    }
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatBytes(bytes) {
    if (typeof bytes !== 'number' || bytes < 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Analyze memory usage of a data structure
   * @param {Object} obj - Object to analyze
   * @param {boolean} isTrie - Whether the object is a Trie structure
   * @returns {Object} Memory analysis results
   */
  analyzeMemoryUsage(obj, isTrie = false) {
    if (!obj) {
      console.warn('⚠️ No object provided for memory analysis');
      return null;
    }

    const processMemory = process.memoryUsage();
    
    // Calculate component sizes
    const trieSize = isTrie ? this.getObjectV8Size(obj.root) : 0;
    const semanticSetsSize = isTrie ? 0 : this.getObjectV8Size(obj.semanticSets);
    const termMappingsSize = this.getObjectV8Size(obj.termMappings);
    const termToTextIndicesSize = this.getObjectV8Size(obj.termToTextIndices);
    const dataSize = this.getObjectV8Size(obj.data);

    // Calculate total size
    const componentSizes = [
      trieSize, 
      semanticSetsSize, 
      termMappingsSize, 
      termToTextIndicesSize, 
      dataSize
    ].filter(size => size !== null);

    const totalApproximateSize = componentSizes.reduce((sum, size) => sum + size, 0);

    // Create analysis result
    const analysis = {
      processMemory: {
        rss: this.formatBytes(processMemory.rss),
        heapTotal: this.formatBytes(processMemory.heapTotal),
        heapUsed: this.formatBytes(processMemory.heapUsed),
        external: this.formatBytes(processMemory.external)
      },
      structureMemory: {
        trieSize: this.formatBytes(trieSize || 0),
        semanticSetsSize: this.formatBytes(semanticSetsSize || 0),
        termMappingsSize: this.formatBytes(termMappingsSize || 0),
        termToTextIndicesSize: this.formatBytes(termToTextIndicesSize || 0),
        dataSize: this.formatBytes(dataSize || 0)
      },
      totalApproximateSize: this.formatBytes(totalApproximateSize),
      rawSizes: {
        trieSize,
        semanticSetsSize,
        termMappingsSize,
        termToTextIndicesSize,
        dataSize,
        totalApproximateSize
      }
    };

    // Store measurement
    const label = isTrie ? 'trie-memory' : 'map-memory';
    this.measurements.set(label, {
      ...analysis,
      timestamp: Date.now(),
      isTrie
    });

    // Print analysis
    this.printMemoryAnalysis(analysis, isTrie);

    return analysis;
  }

  /**
   * Print memory analysis to console
   * @param {Object} analysis - Memory analysis results
   * @param {boolean} isTrie - Whether this is a Trie analysis
   */
  printMemoryAnalysis(analysis, isTrie) {
    const structureType = isTrie ? 'Trie' : 'Map';
    
    console.log(`📊 ${structureType} Memory Analysis:`);
    console.log('  Process Memory:');
    console.log(`    RSS: ${analysis.processMemory.rss}`);
    console.log(`    Heap Total: ${analysis.processMemory.heapTotal}`);
    console.log(`    Heap Used: ${analysis.processMemory.heapUsed}`);
    console.log(`    External: ${analysis.processMemory.external}`);
    
    console.log('  Structure Memory:');
    if (isTrie) {
      console.log(`    Trie Structure: ${analysis.structureMemory.trieSize}`);
    } else {
      console.log(`    Semantic Sets: ${analysis.structureMemory.semanticSetsSize}`);
    }
    console.log(`    Term Mappings: ${analysis.structureMemory.termMappingsSize}`);
    console.log(`    Term Indices: ${analysis.structureMemory.termToTextIndicesSize}`);
    console.log(`    Data: ${analysis.structureMemory.dataSize}`);
    
    console.log(`  Total Approximate Size: ${analysis.totalApproximateSize}`);
  }

  /**
   * Compare memory usage between two objects
   * @param {Object} obj1 - First object
   * @param {Object} obj2 - Second object
   * @param {string} label1 - Label for first object
   * @param {string} label2 - Label for second object
   * @returns {Object} Comparison results
   */
  compareMemoryUsage(obj1, obj2, label1 = 'Object 1', label2 = 'Object 2') {
    const analysis1 = this.analyzeMemoryUsage(obj1, false);
    const analysis2 = this.analyzeMemoryUsage(obj2, false);

    if (!analysis1 || !analysis2) {
      return null;
    }

    const size1 = analysis1.rawSizes.totalApproximateSize;
    const size2 = analysis2.rawSizes.totalApproximateSize;
    const difference = size2 - size1;
    const percentageDiff = size1 > 0 ? (difference / size1) * 100 : 0;

    const comparison = {
      [label1]: {
        size: analysis1.totalApproximateSize,
        rawSize: size1
      },
      [label2]: {
        size: analysis2.totalApproximateSize,
        rawSize: size2
      },
      difference: {
        bytes: difference,
        formatted: this.formatBytes(Math.abs(difference)),
        percentage: percentageDiff,
        isLarger: difference > 0
      }
    };

    console.log(`\n📊 Memory Comparison:`);
    console.log(`  ${label1}: ${comparison[label1].size}`);
    console.log(`  ${label2}: ${comparison[label2].size}`);
    console.log(`  Difference: ${comparison.difference.formatted} (${comparison.difference.percentage.toFixed(2)}%)`);
    console.log(`  ${label2} is ${comparison.difference.isLarger ? 'larger' : 'smaller'}`);

    return comparison;
  }

  /**
   * Get memory usage trend over time
   * @returns {Array} Array of memory measurements
   */
  getMemoryTrend() {
    return Array.from(this.measurements.entries()).map(([label, measurement]) => ({
      label,
      timestamp: measurement.timestamp,
      totalSize: measurement.totalApproximateSize,
      isTrie: measurement.isTrie
    }));
  }

  /**
   * Get the latest memory measurement
   * @param {string} label - Measurement label
   * @returns {Object|null} Latest measurement or null
   */
  getLatestMeasurement(label) {
    const measurements = Array.from(this.measurements.entries())
      .filter(([key]) => key === label)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp);

    return measurements.length > 0 ? measurements[0][1] : null;
  }

  /**
   * Clear all stored measurements
   */
  clearMeasurements() {
    this.measurements.clear();
  }

  /**
   * Get memory usage summary
   * @returns {Object} Summary of all measurements
   */
  getSummary() {
    const measurements = Array.from(this.measurements.values());
    
    if (measurements.length === 0) {
      return {
        totalMeasurements: 0,
        averageSize: '0 B',
        largestSize: null,
        smallestSize: null
      };
    }

    const sizes = measurements.map(m => m.rawSizes.totalApproximateSize);
    const averageSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const largest = measurements.reduce((max, m) => 
      m.rawSizes.totalApproximateSize > max.rawSizes.totalApproximateSize ? m : max
    );
    const smallest = measurements.reduce((min, m) => 
      m.rawSizes.totalApproximateSize < min.rawSizes.totalApproximateSize ? m : min
    );

    return {
      totalMeasurements: measurements.length,
      averageSize: this.formatBytes(averageSize),
      largestSize: largest.totalApproximateSize,
      smallestSize: smallest.totalApproximateSize,
      trieMeasurements: measurements.filter(m => m.isTrie).length,
      mapMeasurements: measurements.filter(m => !m.isTrie).length
    };
  }
}

module.exports = { MemoryAnalyzer }; 