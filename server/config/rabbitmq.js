var amqp = require("amqplib");
const debug = require("debug")(__filename);
const EventEmitter = require("events");
const { logger } = require("../errors/errorLogger");
const { inspect } = require("../utils/printHelper");

const REPLY_QUEUE = "amq.rabbitmq.reply-to";

module.exports = exports = {};
exports.create_channel = create_channel;
exports.send_message = send_message;
exports.consume_message_direct = consume_message_direct;
exports.consume_message_topic = consume_message_topic;
exports.close_connection = close_connection;

var cached_channel;
var cached_connection;

const EXCHANGE_NAME = `apc.exchange`;
//due to all env use same rabbitmq server
const AUTO_CONN_AFTER_TIME = 10 * 60 * 1000; //10 min
var actual_AMQP_URL;

function create_channel(
  socketOptions = {},
  url = process.env.AMQP_URL,  
  is_use_channel_cache = true
) {
  return new Promise((resolve, reject) => {
    // return new Promise((resolve, reject) => {
    if (typeof url == "undefined") {
      var err_msg = `Must input 'url' arguments!!!`;
      logger.error(err_msg);
      throw new Error(err_msg);
    }

    if (is_use_channel_cache === true && cached_channel) {
      return resolve(cached_channel);
    }

    amqp
      .connect(url, socketOptions)
      .then(conn => {
        cached_connection = conn;
        return conn.createChannel();
      })
      .then(async channel => {
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

        await channel.assertExchange(EXCHANGE_NAME, "topic", {
          durable: false
        });
        logger.info(`Successfully connected to AMQP_URL at ${url}`);

        //auto close connection after default period of time
        if (socketOptions.auto_close_connection === true) {

          setTimeout(
            close_connection.bind(cached_connection),
            AUTO_CONN_AFTER_TIME
          );
        }

        actual_AMQP_URL = url;
        cached_channel = channel;
        resolve(channel);
      })
      .catch(error => {
        logger.error(
          `Unable connected to AMQP_URL at ${url}:` + inspect(error)
        );
        reject(error);
      });
  });
}

function close_connection() {
  if (cached_connection) {
    
    cached_connection.close();
    logger.info(`Closed connection to AMQP_URL at ${actual_AMQP_URL}`);

    //reset cached values
    cached_channel = null;
    cached_connection = null;    
    actual_AMQP_URL = undefined;
  }
}

//TODO: refactor to use with `topic` sending type
// function send_rpc_message(channel, message, rpcQueue, correlationId) {
//   return new Promise(resolve => {
//     const _correlationId = correlationId || uuid.v4();
//     // listen for the content emitted on the correlationId event
//     channel.responseEmitter.once(correlationId, resolve);
//     channel.sendToQueue(rpcQueue, new Buffer(message), {
//       correlationId: _correlationId,
//       replyTo: REPLY_QUEUE
//     });
//   });
// }

function send_message(channel, message, routing_key, options = {}) {
  const _correlationId =
    options.request_id || options.correlationId || uuid.v4(); //aliases of request_id
  delete options.request_id;

  channel.publish(
    EXCHANGE_NAME,
    _generate_queue_or_routing_key(routing_key),
    new Buffer(message),
    Object.assign({}, options, {
      correlationId: _correlationId
    })
  );
}
/**
 * Consume message by topic routing
 *
 * @param {*} channel
 * @param {*} queue
 * @param {string|array} routing_key a string or an array of routing keys
 * @param {*} callback
 */
function consume_message_topic(channel, queue, routing_key, callback) {
  if (arguments.length != 4) {
    var err_msg = `consume_message_topic() requires 4 arguments, but got ${
      arguments.length
    } arguments`;
    logger.error(err_msg);
    throw new Error(err_msg);
  }

  if (typeof routing_key == "string") {
    routing_key = [routing_key];
  }

  channel.assertQueue(queue, { durable: true }, function(error, ok) {
    for (let [routing_key_ele] of routing_key) {
      channel.bindQueue(ok.queue, EXCHANGE_NAME, _generate_queue_or_routing_key(routing_key_ele));
    }

    channel.consume(ok.queue, callback, { noAck: true });
  });
}
/**
 * generate a variation of queue name or routing key varies upon NODE_ENV
 *
 * @param {string} queue_or_routing_key queue name or routing key
 */
function _generate_queue_or_routing_key(queue_or_routing_key) {

  return `${process.env.NODE_ENV}.${queue_or_routing_key}`;
}

async function consume_message_direct(channel, routing_key, callback, queue) {
  if (arguments.length < 3) {
    var err_msg = `consume_message_direct() requires at least first 3 arguments, but got ${
      arguments.length
    } arguments`;
    logger.error(err_msg);
    throw new Error(err_msg);
  }

  if (typeof routing_key != "string") {
    var err_msg = `consume_message_direct() requires 'routing_key' argument is a string, but got ${typeof routing_key}`;
    logger.error(err_msg);
    throw new Error(err_msg);
  }

  queue = _generate_queue_or_routing_key(queue || process.env.SERVICE_NAME || routing_key);

  var ok = await channel.assertQueue(queue, { durable: true });
  channel.bindQueue(ok.queue, EXCHANGE_NAME, _generate_queue_or_routing_key(routing_key));
  channel.consume(ok.queue, callback, { noAck: true });
}
