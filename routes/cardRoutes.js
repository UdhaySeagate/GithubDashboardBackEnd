const express = require('express');
const { cardsController } = require('../controllers/index');
const { Logger, Utility } = require('../helpers/index');

const router = express.Router();

router.get('/rest/cards/getWatchers', async (req, res) => {
  Logger.log('info', 'get watchers');
  const opts = req.query;
  const result = await cardsController.GetWatchers(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getStargazers', async (req, res) => {
  Logger.log('info', 'get stargazers');
  const opts = req.query;
  const result = await cardsController.GetStargazers(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getIssues', async (req, res) => {
  Logger.log('info', 'get Issues');
  const opts = req.query;
  const result = await cardsController.GetIssues(opts);
  if (result.total >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getCommits', async (req, res) => {
  Logger.log('info', 'get Commits');
  const opts = req.query;
  const result = await cardsController.GetCommits(opts);
  if (result.commits && result.commits.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getClones', async (req, res) => {
  Logger.log('info', 'get clones');
  const opts = req.query;
  const result = await cardsController.GetClones(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getReleases', async (req, res) => {
  Logger.log('info', 'get releases');
  const opts = req.query;
  const result = await cardsController.GetReleases(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getPullRequests', async (req, res) => {
  Logger.log('info', 'get releases');
  const opts = req.query;
  const result = await cardsController.GetPullRequests(opts);
  if (result.totalpr >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getViewDetails', async (req, res) => {
  Logger.log('info', 'get releases');
  const opts = req.query;
  const result = await cardsController.GetViewDetails(opts);
  if (result.visits >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getEvents', async (req, res) => {
  Logger.log('info', 'get events');
  const opts = req.query;
  const result = await cardsController.GetEvents(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getForks', async (req, res) => {
  Logger.log('info', 'get forks');
  const opts = req.query;
  const result = await cardsController.GetForks(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getIssueComments', async (req, res) => {
  Logger.log('info', 'get issue comments');
  const opts = req.query;
  const result = await cardsController.GetIssueComments(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getIssueByLabel', async (req, res) => {
  Logger.log('info', 'get issue by label');
  const opts = req.query;
  const result = await cardsController.GetIssueByLabel(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/cards/getMembers', async (req, res) => {
  Logger.log('info', 'get members list');
  const opts = req.query;
  const result = await cardsController.GetMembersList(opts);
  if (result.count >= 0) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

module.exports = router;
