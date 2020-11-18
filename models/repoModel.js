/**
 * Model file to handle all the database connection logis
 */
const { repoSchema } = require('../schema/index');
const { Logger } = require('../helpers/index');
const { filters } = require('../api/index');

const GetRepoListFromDB = async () => {
  try {
    Logger.log('info', `Get repositories list from DB for Repository`);
    const response = await repoSchema.findOne({});
    return response;
  } catch (exc) {
    Logger.log('error', exc);
    throw exc;
  }
};

const SetRepoListToDB = async () => {
  Logger.log('info', `Updating latest repository list to repo collection`);
  const repoList = await filters.GetReposList();
  const update = { $set: { repo: repoList } };
  repoSchema.findOneAndUpdate({}, update, { upsert: true }, err => {
    if (err) {
      Logger.log('error', err);
    }
  });
};

module.exports = {
  GetRepoListFromDB,
  SetRepoListToDB
};
