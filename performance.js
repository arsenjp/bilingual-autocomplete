const performance = {
  timers: new Map(),

  startTimer(label) {
    this.timers.set(label, process.hrtime.bigint());
  },

  endTimer(label) {
    const startTime = this.timers.get(label);
    if (!startTime) {
      throw new Error(`Timer "${label}" was not started`);
    }
    const endTime = process.hrtime.bigint();
    const duration = endTime - startTime;
    this.timers.delete(label);
    return duration;
  },

  formatDuration(nanoseconds) {
    if (nanoseconds < 1000n) {
      return `${nanoseconds}ns`;
    } else if (nanoseconds < 1000000n) {
      return `${Number(nanoseconds) / 1000}µs`;
    } else if (nanoseconds < 1000000000n) {
      return `${Number(nanoseconds) / 1000000}ms`;
    } else {
      return `${Number(nanoseconds) / 1000000000}s`;
    }
  },

  measureOperation(label, operation) {
    this.startTimer(label);
    const result = operation();
    const duration = this.endTimer(label);
    return {
      result,
      duration: this.formatDuration(duration)
    };
  }
};

module.exports = performance; 