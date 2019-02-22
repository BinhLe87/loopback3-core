var amqp = require("amqplib/callback_api");
const debug = require("debug")(__filename);

module.exports = exports = createQueueChannel;

function createQueueChannel(p_url) {
  var url = p_url || process.env.AMQP_URL;

  return (queue, cb) => {
    amqp.connect(url, onceConnected);

    function onceConnected(err, conn) {
      if (err) {
        cb(err);
      } else {
        debug(`OK: RabbitMQ conntected at ${url}`);
        conn.createChannel(onceChannelCreated);
      }

      function onceChannelCreated(err, channel) {
        if (err) {
          cb(err);
        } else {
          channel.assertQueue(queue, { durable: true }, onceQueueCreated);
        }

        function onceQueueCreated(err) {
          if (err) {
            cb(err);
          } else {
            cb(null, channel, conn);
          }
        }
      }
    }
  };
}
