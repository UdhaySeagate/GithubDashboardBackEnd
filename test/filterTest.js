const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
chai.should();

const server = require('../server');

describe('Filters API', function() {
  it('Returns list of repositories', done => {
    chai
      .request(server)
      .get('/rest/filters/getRepos')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Returns organization information', done => {
    chai
      .request(server)
      .get('/rest/filters/getOrg')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
  it('Triggers scheduled jobs', done => {
    chai
      .request(server)
      .get('/rest/filters/scheduler')
      .then(res => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });
});