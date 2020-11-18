const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { scheduler } = require('./scheduler/index');
const { filterRouter, cardsRouter } = require('./routes/index');
const { Logger } = require('./helpers/index');

const app = express();
dotenv.config();

app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }));
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use('/', async (req, res, next) => {
  // middleware to validate the correct origin
  if (req.headers.origin) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
  }
  Logger.log('info', `Middleware running: ${req.hostname}`);
  next();
});

// Database connection
mongoose.Promise = global.Promise;
Logger.log('info', 'Initiating DB connection');
mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const db = mongoose.connection;
db.on('error', () => Logger.log('error', 'FAILED to connect to mongoose'));
db.once('open', () => Logger.log('info', 'MongoDB is running'));

app.use(filterRouter, cardsRouter);

app.set('host', process.env.HOST || 'http://localhost');
app.set('port', process.env.PORT || 9090);

app.listen(app.get('port'), () => {
  Logger.log('info', `App is running at ${app.get('host')}:${app.get('port')}`);
  console.log('info', `App is running at ${app.get('host')}:${app.get('port')}`);
});

const CompleteJob = cron.schedule('3 0 * * *', () => {
  Logger.log('info', 'Cron job running at 00:03 on daily basis');
  const CronJob = async () => {
    const type = 'all';
    const result = await scheduler.ScheduledJobs(type);
    if (result === 'success') {
      Logger.log('info', 'Cron job completed');
    } else {
      Logger.log('info', 'Cron job failed and retring');
      await CronJob();
    }
  };
  CronJob();
});
Logger.log('info', `All metric scheduler enabled ${CompleteJob}`);

const EventsJob = cron.schedule('*/59 * * * *', () => {
  Logger.log('info', 'Cron job running one hour time interval');
  const type = 'events';
  scheduler.ScheduledJobs(type);
});
Logger.log('info', `Events scheduler enabled ${EventsJob}`);

module.exports = app;
