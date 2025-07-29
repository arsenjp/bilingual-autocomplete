/**
 * Performance monitoring utility for measuring operation timing
 * Provides high-resolution timing and automatic unit conversion
 */
class PerformanceMonitor {
  constructor() {
    this.timers = new Map();
    this.measurements = new Map();
  }

  /**
   * Start a timer with the given label
   * @param {string} label - Timer label
   */
  startTimer(label) {
    if (!label || typeof label !== 'string') {
      throw new Error('Timer label must be a non-empty string');
    }

    if (this.timers.has(label)) {
      throw new Error(`Timer "${label}" is already running`);
    }

    this.timers.set(label, process.hrtime.bigint());
  }

  /**
   * End a timer and return the duration
   * @param {string} label - Timer label
   * @returns {bigint} Duration in nanoseconds
   */
  endTimer(label) {
    if (!label || typeof label !== 'string') {
      throw new Error('Timer label must be a non-empty string');
    }

    const startTime = this.timers.get(label);
    if (!startTime) {
      throw new Error(`Timer "${label}" was not started`);
    }

    const endTime = process.hrtime.bigint();
    const duration = endTime - startTime;
    
    this.timers.delete(label);
    return duration;
  }

  /**
   * Format duration from nanoseconds to human-readable string
   * @param {bigint} nanoseconds - Duration in nanoseconds
   * @returns {string} Formatted duration string
   */
  formatDuration(nanoseconds) {
    if (typeof nanoseconds !== 'bigint' && typeof nanoseconds !== 'number') {
      throw new Error('Duration must be a bigint or number');
    }

    const ns = BigInt(nanoseconds);

    if (ns < 1000n) {
      return `${ns}ns`;
    } else if (ns < 1000000n) {
      return `${Number(ns) / 1000}µs`;
    } else if (ns < 1000000000n) {
      return `${Number(ns) / 1000000}ms`;
    } else {
      return `${Number(ns) / 1000000000}s`;
    }
  }

  /**
   * Measure the execution time of an operation
   * @param {string} label - Operation label
   * @param {Function} operation - Function to measure
   * @returns {Object} Result with operation result and duration
   */
  measureOperation(label, operation) {
    if (!label || typeof label !== 'string') {
      throw new Error('Operation label must be a non-empty string');
    }

    if (typeof operation !== 'function') {
      throw new Error('Operation must be a function');
    }

    this.startTimer(label);
    
    let result;
    let error;
    
    try {
      result = operation();
    } catch (err) {
      error = err;
    }
    
    const duration = this.endTimer(label);
    const formattedDuration = this.formatDuration(duration);

    // Store measurement for later analysis
    this.measurements.set(label, {
      duration: formattedDuration,
      nanoseconds: duration,
      timestamp: Date.now()
    });

    if (error) {
      throw error;
    }

    return {
      result,
      duration: formattedDuration,
      nanoseconds: duration
    };
  }

  /**
   * Get all stored measurements
   * @returns {Map} Map of all measurements
   */
  getMeasurements() {
    return new Map(this.measurements);
  }

  /**
   * Get a specific measurement
   * @param {string} label - Measurement label
   * @returns {Object|null} Measurement object or null if not found
   */
  getMeasurement(label) {
    return this.measurements.get(label) || null;
  }

  /**
   * Clear all stored measurements
   */
  clearMeasurements() {
    this.measurements.clear();
  }

  /**
   * Get performance summary
   * @returns {Object} Summary of all measurements
   */
  getSummary() {
    const measurements = Array.from(this.measurements.values());
    
    if (measurements.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: '0ns',
        fastestOperation: null,
        slowestOperation: null
      };
    }

    const totalNs = measurements.reduce((sum, m) => sum + m.nanoseconds, 0n);
    const averageNs = totalNs / BigInt(measurements.length);
    
    const fastest = measurements.reduce((min, m) => 
      m.nanoseconds < min.nanoseconds ? m : min
    );
    
    const slowest = measurements.reduce((max, m) => 
      m.nanoseconds > max.nanoseconds ? m : max
    );

    return {
      totalOperations: measurements.length,
      averageDuration: this.formatDuration(averageNs),
      fastestOperation: fastest,
      slowestOperation: slowest,
      totalDuration: this.formatDuration(totalNs)
    };
  }

  /**
   * Print performance summary to console
   */
  printSummary() {
    const summary = this.getSummary();
    
    console.log('\n📊 Performance Summary:');
    console.log(`  Total operations: ${summary.totalOperations}`);
    console.log(`  Average duration: ${summary.averageDuration}`);
    console.log(`  Total duration: ${summary.totalDuration}`);
    
    if (summary.fastestOperation) {
      console.log(`  Fastest: ${summary.fastestOperation.duration}`);
    }
    
    if (summary.slowestOperation) {
      console.log(`  Slowest: ${summary.slowestOperation.duration}`);
    }
  }

  /**
   * Check if a timer is currently running
   * @param {string} label - Timer label
   * @returns {boolean} True if timer is running
   */
  isTimerRunning(label) {
    return this.timers.has(label);
  }

  /**
   * Get all running timers
   * @returns {Array<string>} Array of running timer labels
   */
  getRunningTimers() {
    return Array.from(this.timers.keys());
  }
}

module.exports = { PerformanceMonitor }; 