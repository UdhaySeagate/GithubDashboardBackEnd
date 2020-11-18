/**
 * Model file to handle all the database connection logis
 */
const { commentsSchema } = require('../schema/index');
const { Logger } = require('../helpers/index');

const GetCommentsFromDB = async opts => {
  try {
    Logger.log('info', `Get comments count from DB for Repository : ${opts.repoName}`);
    const promiseAll = [];
    const repname = opts.repoName.split(',');
    /* eslint-disable no-restricted-syntax */
    for (const repo of repname) {
      promiseAll.push(commentsSchema.findOne({ repo }));
    }
    const response = await Promise.all(promiseAll);
    return response;
  } catch (exc) {
    Logger.log('error', exc);
    throw exc;
  }
};

const SetCommentsToDB = async data => {
  Logger.log('info', `Updating latest comments count to collection for Repository : ${data.repo}`);
  const query = { repo: data.repo };
  const update = { $set: { list: data.list } };
  commentsSchema.findOneAndUpdate(query, update, { upsert: true }, err => {
    if (err) {
      Logger.log('error', err);
    }
  });
};

module.exports = {
  GetCommentsFromDB,
  SetCommentsToDB
};
