/**
 * Model file to handle all the database connection logis
 */
const { contributorsSchema } = require('../schema/index');
const { Logger } = require('../helpers/index');

const GetContributorsFromDB = async opts => {
  try {
    Logger.log('info', `Get contributors list from DB for Repository : ${opts.repoName}`);
    const promiseAll = [];
    const repname = opts.repoName.split(',');
    /* eslint-disable no-restricted-syntax */
    for (const repo of repname) {
      promiseAll.push(contributorsSchema.findOne({ repo }));
    }
    const response = await Promise.all(promiseAll);
    return response;
  } catch (exc) {
    Logger.log('error', exc);
    throw exc;
  }
};

const SetContributorsToDB = async data => {
  Logger.log('info', `Updating latest contributors list to collection for Repository : ${data.repo}`);
  const query = { repo: data.repo };
  const update = { $set: { list: data.list } };
  contributorsSchema.findOneAndUpdate(query, update, { upsert: true }, err => {
    if (err) {
      Logger.log('error', err);
    }
  });
};

module.exports = {
  GetContributorsFromDB,
  SetContributorsToDB
};
