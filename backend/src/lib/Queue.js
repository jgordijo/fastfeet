import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import DeliveryCreate from '../app/jobs/DeliveryCreate';
import DeliveryUpdate from '../app/jobs/DeliveryUpdate';
import redisConfig from '../config/redis';

const jobs = [CancellationMail, DeliveryCreate, DeliveryUpdate]

class Queue {
    constructor() {
        this.queues = {};
        this.init();
    }

    init() {
        jobs.forEach(({ key, handle }) => {
            this.queues[key] = {
                bee: new Bee(key, {
                    redis: redisConfig,
                }),
                handle,
            };
        });
    }

    add(queue, job) {
        return this.queues[queue].bee.createJob(job).save();
    }

    processQueue() {
        jobs.forEach(job => {
            const { bee, handle } = this.queues[job.key];

            bee.on('failed', this.handleFailure).process(handle);
        });
    }

    handleFailure(job, err) {
        console.log(`Queue ${job.queue.name}: Failed`, err);
    }
}

export default new Queue();
