var amqp = require("amqplib");
const debug = require("debug")(__filename);
const EventEmitter = require("events");
const { logger } = require("../errors/errorLogger");
const {inspect} = require('../utils/printHelper');

const REPLY_QUEUE = "amq.rabbitmq.reply-to";

module.exports = exports = {};
exports.create_channel = create_channel;
exports.send_rpc_message = send_rpc_message;
exports.send_message = send_message;
exports.consume_message = consume_message;

var cached_channel;

function create_channel(
  queue_name,
  url = process.env.AMQP_URL,
  socketOptions = {},
  is_use_channel_cache = true
) {
  return new Promise((resolve, reject) => {
    // return new Promise((resolve, reject) => {
    if (typeof url == "undefined" || typeof queue_name == "undefined") {
      logger.error(`Must input 'url' and 'queue' arguments!!!`);
      throw new Error(`Must input 'url' and 'queue' arguments!!!`);
    }

    if (is_use_channel_cache === true && cached_channel) {
      return resolve(cached_channel);
    }

    amqp
      .connect(url, socketOptions)
      .then(conn => conn.createChannel())
      .then(channel => {
        // create an event emitter where rpc responses will be published by correlationId
        channel.responseEmitter = new EventEmitter();
        channel.responseEmitter.setMaxListeners(0);
        channel.consume(
          REPLY_QUEUE,
          msg =>
            channel.responseEmitter.emit(
              msg.properties.correlationId,
              msg.content
            ),
          { noAck: true }
        );
        channel.assertQueue(queue_name, { durable: true });

        logger.info(`Successfully connected to AMQP_URL at ${url}`);

        cached_channel = channel;
        resolve(channel);
      }).catch(error => {
        logger.error(`Unable connected to AMQP_URL at ${url}:` + inspect(error));
        reject(error);
      });
  });
}

function send_rpc_message(channel, message, rpcQueue, correlationId) {
  return new Promise(resolve => {
    const _correlationId = correlationId || uuid.v4();
    // listen for the content emitted on the correlationId event
    channel.responseEmitter.once(correlationId, resolve);
    channel.sendToQueue(rpcQueue, new Buffer(message), {
      correlationId: _correlationId,
      replyTo: REPLY_QUEUE
    });
  });
}

function send_message(channel, message, queue, correlationId) {
  const _correlationId = correlationId || uuid.v4();
  channel.sendToQueue(queue, new Buffer(message), {
    correlationId: _correlationId
  });
}

function consume_message(channel, queue, callback) {
  channel.consume(queue, callback, { noAck: true });
}
