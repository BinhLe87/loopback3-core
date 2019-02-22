const Joi = require('joi');

var value = {
  id: 12,
  type: "workbook",
  elements: [
      {
          id: 20,
          type: "chapter",            
          display: 0,
          elements: [
              {
                  id: 30,
                  type: "page",
                  display: 0
              },
              {
                  id: 31,
                  type: "page",
                  display: 1
              }                  
          ]
      },
      {
          id: 21,
          type: "chapter",            
          display: 1,
          elements: [
              {
                  id: 40,
                  type: "page",
                  display: 0
              }
              
          ]
      }
  ]    
};

const tree_view_joi = Joi.object().keys({
  id: Joi.number().empty('').required(),
  type: Joi.any().valid('workbook'),
  display: Joi.number().when('type', {
      is: Joi.invalid('workbook'),
      then: Joi.required()
    }),
  elements: Joi.array().items(Joi.lazy(() => Joi.extend({
    base: tree_view_joi
   
  }))).description('array of child elements')
});

var result = Joi.validate(value, tree_view_joi);

console.log(result);
