const redis_utils = require('./index');
const {logger} = require('@cc_server/logger');

function schedule_job(job_data = '', will_exec_in_seconds, callback = ()=> {}) {

    const SCHEDULE_JOB = redis_utils.generate_unique_key('schedule', process.env.SERVICE_NAME || 'unknown_service');
    const SCHEDULE_JOB_REMINDER = `reminder:${SCHEDULE_JOB}`;

    redis_utils.subcribe_notify_keyspace_event(redis_utils.EXPIRED_EVENT_NAME);

    if (!will_exec_in_seconds || typeof will_exec_in_seconds != 'number') {
        throw new Error(`the function schedule_job() requires 'will_exec_in_seconds' argument and must be a number`);
    }

    if (typeof callback != 'function') {

        throw new Error(`the function schedule_job() requires 'callback' argument must be a function`);
    }

    redis_utils.register_callback_for_key(SCHEDULE_JOB, () => {

        //unregister callback for this key to release memory
        redis_utils.unregister_callback_for_key(SCHEDULE_JOB);
        redis_utils.del(SCHEDULE_JOB);

        callback(...arguments);
    });

    redis_utils.redis_client.multi().set(SCHEDULE_JOB, job_data).set(SCHEDULE_JOB_REMINDER, 1).expire(SCHEDULE_JOB_REMINDER, will_exec_in_seconds).exec();

    console.log(SCHEDULE_JOB);
}

var print = (key, value) => {

    console.log(`${key}:...${value}`);
    
}

schedule_job('test_data_5', 5, print);
schedule_job('test_data_20', 20, print);