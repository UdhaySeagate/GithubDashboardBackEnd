/**
 * Scheduler file to handle all the cron jobs running in the time interval
 */
const {
  repoModel,
  watchersModel,
  staredModel,
  issuesModel,
  commitsModel,
  clonesModel,
  pullrequestModel,
  viewsModel,
  actionsModel,
  forksModel,
  releaseModel,
  commentsModel,
  membersModel,
  contributorsModel
} = require('../models/index');
const { filters, cards } = require('../api/index');
const { Logger } = require('../helpers/index');

const WatchersDataJob = async opts => {
  const Yesterday = opts.yesterday;
  const getWatchersFromDb = await watchersModel.GetWatchersFromDB(opts);
  const [getWatchersList] = await cards.GetWatchersList(opts);
  if (opts.exist && getWatchersFromDb && getWatchersFromDb[0] !== null) {
    if (getWatchersList && getWatchersList.length) {
      let filteredData = getWatchersFromDb[0].list.filter(watch => watch.date.split('T')[0] !== Yesterday);
      filteredData = filteredData.concat(getWatchersList);
      getWatchersFromDb[0].list = filteredData;
      await watchersModel.SetWatchersToDB(getWatchersFromDb[0]);
    }
  } else {
    const data = Object.assign({
      repo: opts.repoName,
      list: []
    });
    /* eslint-disable no-restricted-syntax */
    for (const list of getWatchersList) {
      data.list.push(list);
    }
    await watchersModel.SetWatchersToDB(data);
  }
};

const StarsDataJob = async opts => {
  const [getStarsList] = await cards.GetStargazersList(opts);
  const data = Object.assign({
    repo: opts.repoName,
    list: []
  });
  /* eslint-disable no-restricted-syntax */
  for (const list of getStarsList) {
    data.list.push({ starred_at: list.starred_at, id: list.id, login: list.login });
  }
  await staredModel.SetStaredToDB(data);
};

const IssuesDataJob = async opts => {
  const [getIssuesList] = await cards.GetIssuesList(opts);
  const data = Object.assign({
    repo: opts.repoName,
    list: []
  });
  /* eslint-disable no-restricted-syntax */
  for (const list of getIssuesList) {
    data.list.push(list);
  }
  await issuesModel.SetIssuesToDB(data);
};

const ContributorsDataJob = async opts => {
  const [getContributorsList] = await cards.GetContributorsList(opts);
  const data = Object.assign({
    repo: opts.repoName,
    list: []
  });
  /* eslint-disable no-restricted-syntax */
  for (const list of getContributorsList) {
    data.list.push(list);
  }
  await contributorsModel.SetContributorsToDB(data);
};

const ReleaseDataJob = async opts => {
  const Yesterday = opts.yesterday;
  const getReleaseFromDb = await releaseModel.GetReleaseFromDB(opts);
  const [getReleaseList] = await cards.GetReleasesList(opts);
  if (opts.exist && getReleaseFromDb && getReleaseFromDb[0] !== null) {
    if (getReleaseList && getReleaseList.length) {
      let filteredData = getReleaseFromDb[0].list.filter(release => release.date.split('T')[0] !== Yesterday);
      filteredData = filteredData.concat(getReleaseList);
      getReleaseFromDb[0].list = filteredData;
      await releaseModel.SetReleaseToDB(getReleaseFromDb[0]);
    }
  } else {
    const data = Object.assign({
      repo: opts.repoName,
      list: []
    });
    /* eslint-disable no-restricted-syntax */
    for (const list of getReleaseList) {
      data.list.push(list);
    }
    await releaseModel.SetReleaseToDB(data);
  }
};

const IssueCommentsDataJob = async opts => {
  const Yesterday = opts.yesterday;
  const getCommentsFromDb = await commentsModel.GetCommentsFromDB(opts);
  if (opts.exist && getCommentsFromDb && getCommentsFromDb[0] !== null) {
    const param = { ...opts };
    param.since = `${Yesterday}T00:00:00Z`;
    const [getCommentsList] = await cards.GetCommentsList(param);
    if (getCommentsList && getCommentsList.length) {
      let filteredData = getCommentsFromDb[0].list.filter(comment => comment.date.split('T')[0] !== Yesterday);
      filteredData = filteredData.concat(getCommentsList);
      getCommentsFromDb[0].list = filteredData;
      await commentsModel.SetCommentsToDB(getCommentsFromDb[0]);
    }
  } else {
    const [getCommentsList] = await cards.GetCommentsList(opts);
    const data = Object.assign({
      repo: opts.repoName,
      list: []
    });
    /* eslint-disable no-restricted-syntax */
    for (const list of getCommentsList) {
      data.list.push(list);
    }
    await commentsModel.SetCommentsToDB(data);
  }
};

const CommitsDataJob = async opts => {
  const Yesterday = opts.yesterday;
  const getCommitsFromDb = await commitsModel.GetCommitsFromDB(opts);
  if (opts.exist && getCommitsFromDb && getCommitsFromDb[0] !== null) {
    const param = { ...opts };
    param.since = `${Yesterday}T00:00:00Z`;
    const [getCommitsList] = await cards.GetCommitsList(param);
    if (getCommitsList && getCommitsList.length) {
      let filteredData = getCommitsFromDb[0].list.filter(commit => commit.date.split('T')[0] !== Yesterday);
      filteredData = filteredData.concat(getCommitsList);
      getCommitsFromDb[0].list = filteredData;
      await commitsModel.SetCommitsToDB(getCommitsFromDb[0]);
    }
  } else {
    const [getCommitsList] = await cards.GetCommitsList(opts);
    const data = Object.assign({
      repo: opts.repoName,
      list: []
    });
    /* eslint-disable no-restricted-syntax */
    for (const list of getCommitsList) {
      data.list.push(list);
    }
    await commitsModel.SetCommitsToDB(data);
  }
};

const ClonesDataJob = async opts => {
  const Yesterday = opts.yesterday;
  const getClonesFromDb = await clonesModel.GetClonesFromDB(opts);
  if (opts.exist && getClonesFromDb && getClonesFromDb[0] !== null) {
    const [getClonesList] = await cards.GetClonesList(opts);
    if (getClonesList && getClonesList.length) {
      let filteredData = getClonesFromDb[0].list.filter(clone => clone.date.split('T')[0] !== Yesterday);
      const todayData = getClonesList.filter(clone => clone.date.split('T')[0] === Yesterday);
      filteredData = filteredData.concat(todayData);
      getClonesFromDb[0].list = filteredData;
      await clonesModel.SetClonesToDB(getClonesFromDb[0]);
    }
  } else {
    const [getClonesList] = await cards.GetClonesList(opts);
    const data = Object.assign({
      repo: opts.repoName,
      list: []
    });
    /* eslint-disable no-restricted-syntax */
    for (const list of getClonesList) {
      data.list.push(list);
    }
    await clonesModel.SetClonesToDB(data);
  }
};

const PullRequestDataJob = async opts => {
  const [getPullsList] = await cards.GetPRList(opts);
  const data = Object.assign({
    repo: opts.repoName,
    list: []
  });
  /* eslint-disable no-restricted-syntax */
  for (const list of getPullsList) {
    data.list.push(list);
  }
  await pullrequestModel.SetPullsToDB(data);
};

const ViewsDataJob = async opts => {
  const Yesterday = opts.yesterday;
  const getViewsFromDb = await viewsModel.GetViewsFromDB(opts);
  if (opts.exist && getViewsFromDb && getViewsFromDb[0] !== null) {
    const [getViewsList] = await cards.GetViewList(opts);
    if (getViewsList && getViewsList.length) {
      let filteredData = getViewsFromDb[0].list.filter(view => view.date.split('T')[0] !== Yesterday);
      const todayData = getViewsList.filter(view => view.date.split('T')[0] === Yesterday);
      filteredData = filteredData.concat(todayData);
      getViewsFromDb[0].list = filteredData;
      await viewsModel.SetViewsToDB(getViewsFromDb[0]);
    }
  } else {
    const [getViewsList] = await cards.GetViewList(opts);
    const data = Object.assign({
      repo: opts.repoName,
      list: []
    });
    /* eslint-disable no-restricted-syntax */
    for (const list of getViewsList) {
      data.list.push(list);
    }
    await viewsModel.SetViewsToDB(data);
  }
};

const ActionsDataJob = async opts => {
  const getActionsFromDb = await actionsModel.GetActionsFromDB(opts);
  if (opts.exist && getActionsFromDb && getActionsFromDb[0] !== null) {
    const [getActionsList] = await cards.GetEventsList(opts);
    if (getActionsList && getActionsList.length) {
      getActionsFromDb[0].list = getActionsFromDb[0].list.concat(getActionsList);
      getActionsFromDb[0].list = Array.from(new Set(getActionsFromDb[0].list.map(JSON.stringify))).map(JSON.parse);
      await actionsModel.SetActionsToDB(getActionsFromDb[0]);
    }
  } else {
    const [getActionsList] = await cards.GetEventsList(opts);
    const data = Object.assign({
      repo: opts.repoName,
      list: []
    });
    /* eslint-disable no-restricted-syntax */
    for (const list of getActionsList) {
      data.list.push(list);
    }
    await actionsModel.SetActionsToDB(data);
  }
};

const ForksDataJob = async opts => {
  const [getForksList] = await cards.GetForksList(opts);
  const data = Object.assign({
    repo: opts.repoName,
    list: []
  });
  /* eslint-disable no-restricted-syntax */
  for (const list of getForksList) {
    data.list.push(list);
  }
  await forksModel.SetForksToDB(data);
};

const ScheduledJobs = async type => {
  Logger.log('info', '************ Daily Scheduler initiated ************');
  try {
    const existingData = await repoModel.GetRepoListFromDB();
    const opts = {};
    if (existingData && existingData.repo) {
      opts.exist = true;
    } else {
      opts.exist = false;
    }
    repoModel.SetRepoListToDB();
    membersModel.SetMembersListToDB();
    const repoList = await filters.GetReposList();
    const dateTime = new Date();
    const previousDay = dateTime.setDate(dateTime.getDate() - 1);
    const Yesterday = new Date(previousDay).toISOString().split('T')[0];
    /* eslint-disable no-restricted-syntax */
    for (const repo of repoList) {
      opts.repoName = repo.name;
      /* eslint-disable no-await-in-loop */
      if (type === 'events') {
        await ActionsDataJob(opts);
      } else {
        opts.yesterday = Yesterday;
        const WatchersJob = WatchersDataJob(opts);
        const StarsJob = StarsDataJob(opts);
        const IssuesJob = IssuesDataJob(opts);
        const CommitsJob = CommitsDataJob(opts);
        const ClonesJob = ClonesDataJob(opts);
        const PullRequestJob = PullRequestDataJob(opts);
        const ViewsJob = ViewsDataJob(opts);
        const ForksJob = ForksDataJob(opts);
        const ReleaseJob = ReleaseDataJob(opts);
        const CommentsJob = IssueCommentsDataJob(opts);
        const ContributorsJob = ContributorsDataJob(opts);
        await Promise.all([
          WatchersJob,
          StarsJob,
          IssuesJob,
          CommitsJob,
          ClonesJob,
          PullRequestJob,
          ViewsJob,
          ForksJob,
          ReleaseJob,
          CommentsJob,
          ContributorsJob
        ]);
      }
    }
    Logger.log('info', '************ Daily Scheduler completed ************');
    return 'success';
  } catch (exec) {
    Logger.log('error', exec);
    return 'error';
  }
};

module.exports = {
  ScheduledJobs
};
