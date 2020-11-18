/**
 * API file to handle all the Jira API calls
 */
const request = require('request-promise');
const dotenv = require('dotenv');
const { Logger } = require('../helpers/index');

dotenv.config();

/* eslint-disable-next-line new-cap */
const AccessToken = `Basic ${new Buffer.from(`${process.env.GITHUB_USERNAME}:${process.env.GITHUB_PASSWORD}`).toString('base64')}`;

/* Response changes */
const listResponse = async res => {
  const resObj = [];
  res.forEach(element => {
    if ((element.size > 0 && element.language !== null) || (element.size > 0 && element.language === null) || (element.size < 1 && element.language !== null)) {
      if (element.fork === false && element.permissions.push === true) {
        resObj.push({
          id: element.id,
          name: element.name,
          size: element.size
        });
      }
    }
  });
  return resObj;
};
/* Response changes */

const loopResponse = async acturl => {
  let resarr = new Array(100);
  let resdatas = [];
  let i = 1;
  while (resarr.length >= 100) {
    /* eslint-disable no-await-in-loop */
    const geturl = `${acturl}?direction=asc&per_page=100&page=${i}`;
    const options = {
      method: 'GET',
      url: geturl,
      json: true,
      headers: {
        'User-Agent': process.env.GITHUB_USERNAME,
        Authorization: AccessToken
        // Accept: 'application/vnd.github.v3.star+json'
      }
    };
    /* eslint-disable no-await-in-loop */
    const actResponse = await request(options);
    if (Array.isArray(actResponse)) {
      resarr = [...actResponse];
      resdatas = resdatas.concat(actResponse);
      i += 1;
    } else {
      resarr = [];
      resdatas = [];
    }
  }
  return resdatas;
};

const GetReposList = async () => {
  Logger.log('info', 'Get repo list from github server');
  const url = `https://${process.env.GITHUB_HOST}/orgs/${process.env.GITHUB_ORG}/repos`;
  const repoResponse = await loopResponse(url);
  const resConstruct = await listResponse(repoResponse);
  return resConstruct;
};

const GetOrgDetails = async () => {
  Logger.log('info', 'Get organisation details from github server');
  const options = {
    method: 'GET',
    url: `https://${process.env.GITHUB_HOST}/orgs/${process.env.GITHUB_ORG}`,
    json: true,
    headers: {
      'User-Agent': process.env.GITHUB_USERNAME,
      Authorization: AccessToken
    }
  };
  const data = await request(options);
  const result = Object.assign({
    id: data.id,
    login: data.login,
    name: data.name,
    description: data.description,
    email: data.email,
    created: data.created_at
  });
  return result;
};

module.exports = {
  GetReposList,
  GetOrgDetails
};
