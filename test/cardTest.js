const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
chai.should();

const server = require('../server');

describe('Cards API', function() {
  it('Returns watchers list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getWatchers?repoName=test-repository&from=2020-08-19T00:00:00&upto=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns stars list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getStargazers?repoName=test-repository&from=2020-08-19T00:00:00&upto=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns issues list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getIssues?repoName=test-repository&since=2020-08-19T00:00:00&until=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns commits list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getCommits?repoName=test-repository&since=2020-08-19T00:00:00&until=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns clones list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getClones?repoName=test-repository&from=2020-08-19T00:00:00&upto=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns release list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getReleases?repoName=test-repository&from=2020-08-19T00:00:00&upto=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns pull request list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getPullRequests?repoName=test-repository&from=2020-08-19T00:00:00&upto=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns visit, visitors list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getViewDetails?repoName=test-repository&from=2020-08-19T00:00:00&upto=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns actions list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getEvents?repoName=test-repository&from=2020-08-19T00:00:00&upto=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns forks list for the selected repositories', done => {
    chai
      .request(server)
      .get('/rest/cards/getForks?repoName=test-repository&from=2020-08-19T00:00:00&upto=2020-09-18T00:00:00')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
});