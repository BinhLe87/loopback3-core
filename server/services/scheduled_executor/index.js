process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.SERVICE_NAME = 'scheduled_executor';



const {rabbitmq} = require('@cc_server/utils');
const {logger} = require('@cc_server/logger');



function subscribe_job_schedule_in_queue(callback) {

    rabbitmq.consume_message_direct('automation.job_schedule', callback, 'rabbitmq');
}

function consume_job_schedule_in_queue() {

    subscribe_job_schedule_in_queue((msg) => {

        var message = msg.content.toString();
        logger.info("=> received", message);
        const { correlationId, replyTo } = msg.properties;

        logger.info(message);
    })
}

consume_job_schedule_in_queue();