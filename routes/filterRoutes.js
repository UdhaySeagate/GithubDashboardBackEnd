const express = require('express');
const { filtersController } = require('../controllers/index');
const { Logger, Utility } = require('../helpers/index');
const { scheduler } = require('../scheduler/index');

const router = express.Router();

router.get('/rest/filters/getRepos', async (req, res) => {
  Logger.log('info', 'Initializing repos');
  const result = await filtersController.GetRepos();
  if (Array.isArray(result)) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/filters/getOrg', async (req, res) => {
  Logger.log('info', 'Initializing org');
  const result = await filtersController.GetOrg();
  if (result.login) {
    const response = await Utility.SuccessResponse(result);
    res.send(response);
  } else {
    const response = await Utility.ErrorResponse(result);
    res.send(response);
  }
});

router.get('/rest/filters/scheduler', async (req, res) => {
  Logger.log('info', 'Initializing scheduler');
  scheduler.ScheduledJobs();
  const response = await Utility.SuccessResponse({});
  res.send(response);
});

module.exports = router;
