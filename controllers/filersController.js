/**
 * Controller file to handle all the business logis
 */
const { Logger } = require('../helpers/index');
const { filters } = require('../api/index');
const { repoModel } = require('../models/index');

const GetRepos = async () => {
  try {
    let repoList = [];
    const DbData = await repoModel.GetRepoListFromDB();
    if (DbData && DbData.repo) {
      repoList = DbData.repo;
    } else {
      repoList = await filters.GetReposList();
    }
    return repoList;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetOrg = async () => {
  try {
    const orgDetails = await filters.GetOrgDetails();
    return orgDetails;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

module.exports = {
  GetRepos,
  GetOrg
};
