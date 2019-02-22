var Channel = require("../../config/rabbitmq")(
  "amqp://admin:admin@ec2-54-175-21-51.compute-1.amazonaws.com:5672"
);
const Joi = require("joi");
const axios = require("axios");

var queue = "move_position";
Channel(queue, function(err, channel, conn) {
  if (err) {
    console.error(err.stack);
  } else {
    console.log("channel and queue created");
    consume();
  }
  function consume() {
    channel.get(queue, {}, onConsume);
    function onConsume(err, msg) {
      if (err) {
        console.warn(err.message);
      } else if (msg) {
        var message = msg.content.toString();

        //validate message
        var tree_view_joi_result = tree_view_joi.validate(message);

        


        setTimeout(function() {
          channel.ack(msg);
          consume();
        }, 1e3);
      } else {
        console.log("no message, waiting...");
        setTimeout(consume, 1e3);
      }
    }
  }
});

const tree_view_joi = Joi.object().keys({
  id: Joi.number()
    .empty("")
    .required(),
  type: Joi.any().valid("workbook", "chapter", "page"),
  display: Joi.number().when("type", {
    is: Joi.invalid("workbook"),
    then: Joi.required()
  }),
  elements: Joi.array()
    .items(Joi.lazy(() => tree_view_joi))
    .description("array of child elements")
});

async function get_tree_data_from_api(workbook_id) {
  const filter_options = {
    include: {
      relation: "workbook_chapters",
      scope: {
        order: "display_index ASC",
        include: {
          relation: "chapter",
          scope: {
            include: {
              relation: "chapter_pages",
              scope: {
                order: "display_index ASC",
                include: "page"
              }
            }
          }
        }
      }
    }
  };

  var tree_data = await axios.request({
    url: `/workbooks/${workbook_id}`,
    method: 'get',
    baseURL: process.env.API_URL,
    params: {
      access_token: process.env.API_ACCESS_TOKEN,
      filter: filter_options
    }
  });

  return tree_data;
}


