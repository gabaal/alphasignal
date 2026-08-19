const { compileAndRenderPdf } = require('./pdfEngine');
const ledgerService = require('./ledgerService');
const templateService = require('./templateService');
const webhookService = require('./webhookService');

/**
 * Concurrency Worker Queue Adapter for DocForge Batch Processing
 */
class QueueAdapterService {
  constructor() {
    this.driver = process.env.DOCFORGE_QUEUE_DRIVER || 'local'; // 'local' or 'redis'
    this.concurrency = parseInt(process.env.DOCFORGE_CONCURRENCY || '5', 10);
    this.activeWorkers = 0;
    this.taskQueue = [];
  }

  /**
   * Enqueues a render task to the worker queue
   * @param {Function} taskFn 
   */
  enqueueTask(taskFn) {
    this.taskQueue.push(taskFn);
    this.processQueue();
  }

  async processQueue() {
    if (this.activeWorkers >= this.concurrency || this.taskQueue.length === 0) {
      return;
    }

    this.activeWorkers++;
    const task = this.taskQueue.shift();

    try {
      await task();
    } catch (err) {
      console.error('Queue Worker Task Error:', err.message);
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }

  /**
   * Returns queue metrics & worker status
   */
  getMetrics() {
    return {
      driver: this.driver,
      concurrency: this.concurrency,
      active_workers: this.activeWorkers,
      pending_tasks: this.taskQueue.length
    };
  }
}

module.exports = new QueueAdapterService();
