/**
 * Model file to handle all the database connection logis
 */
const { commitsSchema } = require('../schema/index');
const { Logger } = require('../helpers/index');

const GetCommitsFromDB = async opts => {
  try {
    Logger.log('info', `Get commits count from DB for Repository : ${opts.repoName}`);
    const promiseAll = [];
    const repname = opts.repoName.split(',');
    /* eslint-disable no-restricted-syntax */
    for (const repo of repname) {
      promiseAll.push(commitsSchema.findOne({ repo }));
    }
    const response = await Promise.all(promiseAll);
    return response;
  } catch (exc) {
    Logger.log('error', exc);
    throw exc;
  }
};

const SetCommitsToDB = async data => {
  Logger.log('info', `Updating latest commits count to collection for Repository : ${data.repo}`);
  const query = { repo: data.repo };
  const update = { $set: { list: data.list } };
  commitsSchema.findOneAndUpdate(query, update, { upsert: true }, err => {
    if (err) {
      Logger.log('error', err);
    }
  });
};

module.exports = {
  GetCommitsFromDB,
  SetCommitsToDB
};
