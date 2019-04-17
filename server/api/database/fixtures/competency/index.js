const faker = require('faker/locale/en');
const MPPG = require('../../../helpers/mppg');
const mppg = new MPPG({ idLength: 4 });

faker.seed(123456);

/*
    Managing
    |--Managing	Career Internally
    |--Managing	Conflict
    |--Managing Expectations
    |--Managing Stress
    |--|--Stress Relief
    |--Managing Time Efficiently
    Navigating
    |--Navigating Change
    |--Navigating Difficult Conversations
    |--Navigating Unbalanced Organizational Culture
    Setting
    |--Setting Boundaries
    |--Setting Priorities
    Adapting
    |--Adapting Communication Style
    |--Adapting Leadership Style
    |--Adapting Personality Style
*/

module.exports = exports = {};
exports.generate_competency_keywords = async function() {
  var root_id = mppg.getRootId();
  __generate_Managing(root_id);

  root_id = mppg.getNextSiblingPath(root_id);
  __generate_Navigating(root_id);

  root_id = mppg.getNextSiblingPath(root_id);
  __generate_Setting(root_id);

  root_id = mppg.getNextSiblingPath(root_id);
  __generate_Adapting(root_id);
};

async function __generate_Managing(root_path_id = mppg.getRootId()) {
  //Managing
  var path_parent = root_path_id;
  await require('../model.fixtures')(1, 'competency', {
    name: 'Managing',
    mPathId: faker.random.number(),
    mPath: path_parent
  });

  //|--Managing Career Internally
  var path_children_lv1 = mppg.getNextChildPath(path_parent);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Managing Career Internally',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });

  //|--Managing Conflict
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Managing Conflict',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });

  //|--Managing Expectations
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Managing Expectations',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });

  //|--Managing Stress
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Managing Stress',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });
  //|--|--Stress Relief
  var path_children_lv2 = mppg.getNextChildPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Stress Relief',
    mPathId: faker.random.number(),
    mPath: path_children_lv2
  });

  //|--Managing Time Efficiently
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Managing Time Efficiently',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });
}

async function __generate_Navigating(root_path_id = mppg.getRootId()) {
  //Navigating
  var path_parent = root_path_id;
  await require('../model.fixtures')(1, 'competency', {
    name: 'Navigating',
    mPathId: faker.random.number(),
    mPath: path_parent
  });

  //|--Navigating Change
  var path_children_lv1 = mppg.getNextChildPath(path_parent);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Navigating Change',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });

  //|--Navigating Difficult Conversations
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Navigating Difficult Conversations',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });

  //|--Navigating Unbalanced Organizational Culture
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Navigating Unbalanced Organizational Culture',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });
}

async function __generate_Setting(root_path_id = mppg.getRootId()) {
  //Setting
  var path_parent = root_path_id;
  await require('../model.fixtures')(1, 'competency', {
    name: 'Setting',
    mPathId: faker.random.number(),
    mPath: path_parent
  });

  //|--Setting Boundaries
  var path_children_lv1 = mppg.getNextChildPath(path_parent);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Setting Boundaries',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });

  //|--Setting Priorities
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Setting Priorities',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });
}

async function __generate_Adapting(root_path_id = mppg.getRootId()) {
  //Adapting
  var path_parent = root_path_id;
  await require('../model.fixtures')(1, 'competency', {
    name: 'Adapting',
    mPathId: faker.random.number(),
    mPath: path_parent
  });

  //|--Adapting Communication Style
  var path_children_lv1 = mppg.getNextChildPath(path_parent);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Adapting Communication Style',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });

  //|--Adapting Leadership Style
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Adapting Leadership Style',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });

  //|--Adapting Personality Style
  path_children_lv1 = mppg.getNextSiblingPath(path_children_lv1);
  await require('../model.fixtures')(1, 'competency', {
    name: 'Adapting Personality Style',
    mPathId: faker.random.number(),
    mPath: path_children_lv1
  });
}
