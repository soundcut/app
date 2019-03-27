/** Queue class.
 *  A simplistic queue with:
 *  - asynchronous function jobs
 *  - configurable concurrency
 *  - autostarted by default
 *  - no timeout
 *  - no events
 *  - no job error handling
 */
class Queue {
  /**
   * Queue constructor.
   * @constructor
   * @param {number} concurrency - Queue concurrency = 5
   */
  constructor(concurrency = 5) {
    this.concurrency = concurrency || Infinity;
    this.pending = 0;
    this.running = false;
    this.jobs = [];
  }

  /**
   * Push a job function to the queue.
   * @param {Function} job - async function(resolve, reject).
   * @returns {Promise} promise - result of job (resolved *or* rejected value)
   */
  push(job) {
    const promise = this._insert(job);
    this.start();
    return promise;
  }

  _insert(job) {
    return new Promise((resolve, reject) => {
      async function wrapper() {
        try {
          const result = await job();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }

      this.jobs.push(wrapper);
    });
  }

  done() {
    this.running = false;
  }

  async start() {
    this.running = true;

    if (this.pending >= this.concurrency) {
      return;
    }

    if (this.jobs.length === 0) {
      if (this.pending === 0) {
        this.done();
      }
      return;
    }

    const job = this.jobs.shift();

    const next = () => {
      this.pending--;
      if (this.pending === 0 && this.jobs.length === 0) {
        this.done();
      } else if (this.running) {
        this.start();
      }
    };

    this.pending++;
    job().then(next, next);

    if (this.running && this.jobs.length > 0) {
      this.start();
    }
  }
}

module.exports = Queue;
