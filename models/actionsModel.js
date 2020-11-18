/**
 * Model file to handle all the database connection logis
 */
const { actionsSchema } = require('../schema/index');
const { Logger } = require('../helpers/index');

const GetActionsFromDB = async opts => {
  try {
    Logger.log('info', `Get actions count from DB for Repository : ${opts.repoName}`);
    const promiseAll = [];
    const repname = opts.repoName.split(',');
    /* eslint-disable no-restricted-syntax */
    for (const repo of repname) {
      promiseAll.push(actionsSchema.findOne({ repo }));
    }
    const response = await Promise.all(promiseAll);
    return response;
  } catch (exc) {
    Logger.log('error', exc);
    throw exc;
  }
};

const SetActionsToDB = async data => {
  Logger.log('info', `Updating latest actions count to collection for Repository : ${data.repo}`);
  const query = { repo: data.repo };
  const update = { $set: { list: data.list } };
  actionsSchema.findOneAndUpdate(query, update, { upsert: true }, err => {
    if (err) {
      Logger.log('error', err);
    }
  });
};

module.exports = {
  GetActionsFromDB,
  SetActionsToDB
};
