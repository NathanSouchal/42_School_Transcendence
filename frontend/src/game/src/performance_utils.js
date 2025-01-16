import state from "../../app.js";

class PerformanceTracker {
  constructor() {
    this.stats = {};
  }

  async updateLoadingTime(category, name, fn, loadValue = 10) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const time = end - start;

    if (!this.stats[category]) {
      this.stats[category] = {};
    }
    this.stats[category][name] = time;

    state.state.gameLoadingPercentage += loadValue;
    console.log(`Loading: ${state.state.gameLoadingPercentage}`);
    return result;
  }

  printPerformanceReport() {
    console.log("\n======= Performance Report =======");
    let totalTime = 0;

    Object.entries(this.stats).forEach(([category, measurements]) => {
      console.log(`\n${category}:`);
      let categoryTotal = 0;

      Object.entries(measurements).forEach(([name, time]) => {
        console.log(`  ${name}: ${time.toFixed(2)}ms`);
        categoryTotal += time;
        totalTime += time;
      });

      console.log(`  Total ${category}: ${categoryTotal.toFixed(2)}ms`);
    });

    console.log(`\nTotal Time: ${totalTime.toFixed(2)}ms`);
    console.log("===============================\n");
  }

  getStats() {
    return this.stats;
  }

  clearStats() {
    this.stats = {};
  }
}
export const performanceTracker = new PerformanceTracker();

export const updateLoadingTime =
  performanceTracker.updateLoadingTime.bind(performanceTracker);
export const printPerformanceReport =
  performanceTracker.printPerformanceReport.bind(performanceTracker);
