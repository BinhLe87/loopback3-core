var amqp = require("amqplib");
const debug = require("debug")(__filename);
const EventEmitter = require("events");
const { logger } = require("@cc_server/logger");
const { inspect } = require("@cc_server/utils/lib/printHelper");
const Promise = require('bluebird');
const uuid = require('uuid');

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
const AUTO_CONN_AFTER_TIME = 10 * 60 * 1000; //10 min
var actual_AMQP_URL;

function create_channel(
  socketOptions = {},
  url = process.env.AMQP_URL,
  exchange_name = EXCHANGE_NAME,
  is_use_channel_cache = true
) {
  return new Promise((resolve, reject) => {
    // return new Promise((resolve, reject) => {
    if (typeof url == "undefined") {
      var err_msg = `Must input 'url' arguments!!!`;
      logger.error(err_msg);
      throw new Error(err_msg);
    }

    if (is_use_channel_cache === true && cached_channel && url === actual_AMQP_URL) {
      return resolve(cached_channel);
    }

    amqp
      .connect(url, socketOptions)
      .then(conn => {
        cached_connection = conn;

        conn.on('error', function(error) {
          logger.error(`Error connection to AMQP_URL at ${actual_AMQP_URL}:` + inspect(error));
          close_connection();
        })

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

        await channel.assertExchange(exchange_name, "topic", {
          durable: false
        });
        channel.on('error', function(err) {

          close_connection();
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
/**
 *
 *
 * @param {string | object} message message will be delivered
 * @param {*} routing_key routing key
 * @param {channel} channel channel
 * @param {*} [options={}]
 */
async function send_message(message, routing_key, channel, options = {}) {

  if (!channel) {
    channel = await create_channel({ auto_close_connection: true });
  }

  var message_standard = message;
  if (typeof message === 'object') {
    message_standard = JSON.stringify(message);
  }

  const _correlationId =
    options.request_id || options.correlationId || uuid.v4(); //aliases of request_id
  delete options.request_id;

  var result = channel.publish(
    EXCHANGE_NAME,
    _generate_queue_or_routing_key(routing_key),
    Buffer.from(message_standard),
    Object.assign({}, options, {
      correlationId: _correlationId
    })
  );

  return result;
}
/**
 * Consume message by topic routing
 *
 * @param {*} channel
 * @param {*} queue_name
 * @param {string|array} routing_key a string or an array of routing keys
 * @param {*} callback
 */
async function consume_message_topic(routing_key, callback, queue_name, channel) {
  if (arguments.length < 2) {
    var err_msg = `consume_message_topic() requires at least first 2 arguments, but got ${
      arguments.length
    } arguments`;
    logger.error(err_msg);
    throw new Error(err_msg);
  }

  if (queue_name && typeof queue_name !== 'string') {
    channel = queue_name;
    queue_name = undefined;
  }

  if (!channel) {
    channel = await create_channel();
  }

  if (typeof routing_key == "string") {
    routing_key = [routing_key];
  }

  var queue_name_env = _generate_queue_or_routing_key(queue_name || process.env.SERVICE_NAME);

  channel.assertQueue(queue_name_env, { durable: true }, function(error, ok) {

    Promise.all(routing_key.map((route_key_ele) => {

      channel.bindQueue(ok.queue, EXCHANGE_NAME, _generate_queue_or_routing_key(route_key_ele));
    })).then(() => {
      channel.consume(ok.queue, callback, { noAck: true });
    });
  });
}
/**
 * generate a variation of queue name or routing key varies upon NODE_ENV //due to all env use same rabbitmq server
 *
 * @param {string} queue_or_routing_key queue name or routing key
 */
function _generate_queue_or_routing_key(queue_or_routing_key) {

  if(!queue_or_routing_key) {
    throw new Error('Undefined queue name or routing key');
  }

  return `${process.env.NODE_ENV}.${queue_or_routing_key}`;
}

async function consume_message_direct(routing_key, callback, queue_name, channel) {
  if (arguments.length < 2) {
    var err_msg = `consume_message_direct() requires at least first 2 arguments, but got ${
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

  if (queue_name && typeof queue_name !== 'string') {
    channel = queue_name;
    queue_name = undefined;
  }

  if (!channel) {
    channel = await create_channel()
  }

  var queue_name_env = _generate_queue_or_routing_key(queue_name || process.env.SERVICE_NAME);

  var ok = await channel.assertQueue(queue_name_env, { durable: true });
  await channel.bindQueue(ok.queue, EXCHANGE_NAME, _generate_queue_or_routing_key(routing_key));
  channel.consume(ok.queue, callback, { noAck: true });
}
