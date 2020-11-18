/**
 * Controller file to handle all the business logis
 */
const { Logger, Views } = require('../helpers/index');
const { cards } = require('../api/index');
const {
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

const GroupByDate = async (input, key) => {
  const result = input.reduce((obj, e) => {
    const estKey = e[key];
    (obj[estKey] ? obj[estKey] : (obj[estKey] = null || [])).push(e);
    return obj;
  }, {});
  return result;
};

const dateRange = (startDate, endDate) => {
  const start = startDate.split('-');
  const end = endDate.split('-');
  const startYear = parseInt(start[0], 10);
  const endYear = parseInt(end[0], 10);
  const dates = [];

  for (let i = startYear; i <= endYear; i += 1) {
    const endMonth = i !== endYear ? 11 : parseInt(end[1], 10) - 1;
    const startMon = i === startYear ? parseInt(start[1], 10) - 1 : 0;
    for (let j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j + 1) {
      const month = j + 1;
      const displayMonth = month < 10 ? `0${month}` : month;
      dates.push([i, displayMonth, '01'].join('-'));
    }
  }
  return dates;
};

const lastday = (y, m) => {
  return new Date(y, m + 1, 0).getDate();
};

const GetMonthsFirstLastDay = (month, year) => {
  return [
    {
      start: 1,
      end: lastday(year, month)
    }
  ];
};

const GetWeeksInMonth = (month, year, opts, signall = '') => {
  const weeks = [];
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);
  const numDays = lastDate.getDate();
  let start = 1;
  let end = 7 - firstDate.getDay();
  while (start <= numDays) {
    if (start < 10) {
      start = parseInt(`0${start}`, 10);
    }
    if (end < 10) {
      end = parseInt(`0${end}`, 10);
    }
    weeks.push({ start, end });
    start = end + 1;
    end += 7;
    end = start === 1 && end === 8 ? 1 : end;
    if (end > numDays) end = numDays;
  }
  let weekdata = weeks.length;
  const optsfrom = opts.from ? parseInt(opts.from.split('T')[0].split('-')[2], 10) : parseInt(opts.since.split('T')[0].split('-')[2], 10);
  const optsto = opts.upto ? parseInt(opts.upto.split('T')[0].split('-')[2], 10) : parseInt(opts.until.split('T')[0].split('-')[2], 10);
  // eslint-disable-next-line no-plusplus
  while (weekdata--) {
    if (
      ((signall === 'first' || signall === 'single') && optsfrom > weeks[weekdata].end) ||
      ((signall === 'last' || signall === 'single') && optsto < weeks[weekdata].start)
    ) {
      weeks.splice(weekdata, 1);
    }
  }
  return weeks;
};

const datediff = (first, second) => {
  const date1 = new Date(first);
  const date2 = new Date(second);
  const diffintime = date2.getTime() - date1.getTime();
  const diffindays = diffintime / (1000 * 3600 * 24);
  return Math.round(diffindays);
};

const addonemin = date => {
  const split = date
    .split('T')[1]
    .split('Z')[0]
    .split(':');
  split[1] = parseInt(split[1], 10) + 1;
  return `${date.split('T')[0]}T${split.join(':')}Z`;
};

const RangeFilterChart = (resList, opts, charttype, bytype = '') => {
  const optsfrom = opts.since ? opts.since : opts.from;
  const optst = opts.until ? opts.until : opts.upto;
  const monthArr = opts.since ? dateRange(opts.since.split('T')[0], opts.until.split('T')[0]) : dateRange(opts.from.split('T')[0], opts.upto.split('T')[0]);
  const datevalfrom = opts.since ? opts.since.split('T')[1] : opts.from.split('T')[1];
  const datevalto = opts.until ? opts.until.split('T')[1] : opts.upto.split('T')[1];
  const finarr = [];
  let endatearr = [];
  let weekwise;
  monthArr.forEach((itm, inx) => {
    if (bytype === '') {
      let signall;
      if (inx === 0 && monthArr.length > 1) {
        signall = 'first';
      }
      if (inx === monthArr.length - 1 && monthArr.length > 1) {
        signall = 'last';
      }
      if (monthArr.length === 1) {
        signall = 'single';
      }
      weekwise = GetWeeksInMonth(parseInt(itm.split('-')[1], 10) - 1, itm.split('-')[0], opts, signall);
    } else {
      weekwise = GetMonthsFirstLastDay(parseInt(itm.split('-')[1], 10) - 1, itm.split('-')[0]);
    }
    weekwise.forEach((data, index) => {
      const datastart = data.start < 10 ? `0${data.start}` : data.start;
      const dataend = data.end < 10 ? `0${data.end}` : data.end;
      const initdate = `${itm.split('-')[0]}-${itm.split('-')[1]}-${datastart}T${datevalfrom}`;
      const finaldate = `${itm.split('-')[0]}-${itm.split('-')[1]}-${dataend}T${datevalto}`;
      let startdate;
      let enddate;
      if (endatearr.length > 0) {
        startdate = inx === 0 ? addonemin(endatearr[index - 1]) : addonemin(endatearr[index]);
        enddate = new Date(finaldate) > new Date(optst) ? optst : finaldate;
      } else {
        startdate = new Date(initdate) < new Date(optsfrom) ? optsfrom : initdate;
        enddate = new Date(finaldate) > new Date(optst) ? optst : finaldate;
      }
      if (index === weekwise.length - 1) {
        endatearr = [];
      }
      endatearr.push(enddate);
      const filterdatewise = resList.filter(el => el[charttype] !== null && el[charttype] >= startdate && el[charttype] <= enddate);
      let cnnt = 0;
      let avgdayss = 0;
      let mins = 0;
      if (filterdatewise.length > 0) {
        filterdatewise.forEach(it => {
          cnnt += it.prcount;
          avgdayss += it.avgdays;
          mins += it.avgmins;
        });
      }
      const mntyr = enddate.split('T')[0].split('-');
      mntyr.splice(-1, 1);
      finarr.push({
        startdate,
        enddate,
        prcount: cnnt,
        avgdays: filterdatewise.length > 0 ? avgdayss / filterdatewise.length : 0,
        daysdiff: datediff(startdate, enddate),
        monthyear: mntyr.join('-'),
        avgmins: filterdatewise.length > 0 ? mins / filterdatewise.length : 0
      });
    });
  });
  if (bytype === '') {
    const pushin = [];
    if (finarr.length > 2) {
      for (let i = 1; i < finarr.length - 1; i += 1) {
        if (finarr[i].daysdiff < 7) {
          pushin.push(i);
        }
      }
    } else if (finarr.length === 2 && finarr[0].daysdiff < 7 && finarr[1].daysdiff < 7 && finarr[0].monthyear !== finarr[1].monthyear) {
      pushin.push(0);
    }
    if (pushin.length > 0) {
      for (let j = 0; j < pushin.length; j += 1) {
        pushin.splice(j + 1, 1);
      }
      pushin.forEach(data => {
        if (data > 0 && finarr[data - 1].daysdiff <= 1 && finarr.length === 2) {
          finarr[data - 1].startdate = finarr[data].startdate;
          finarr[data - 1].enddate = finarr[data].enddate;
          finarr[data - 1].prcount = finarr[data].prcount;
          finarr[data - 1].avgdays = finarr[data].avgdays;
          finarr[data - 1].daysdiff = finarr[data].daysdiff;
          finarr[data - 1].avgmins = finarr[data].avgmins;
        } else {
          finarr[data + 1].startdate = finarr[data].startdate;
          finarr[data + 1].prcount = finarr[data + 1].prcount + finarr[data].prcount;
          finarr[data + 1].avgdays = finarr[data].prcount > 0 ? (finarr[data + 1].avgdays + finarr[data].avgdays) / 2 : finarr[data + 1].avgdays;
          finarr[data + 1].avgmins = finarr[data].prcount > 0 ? (finarr[data + 1].avgmins + finarr[data].avgmins) / 2 : finarr[data + 1].avgmins;
        }
      });
      for (let k = pushin.length - 1; k >= 0; k -= 1) {
        finarr.splice(pushin[k], 1);
      }
    }
  }
  const finfarr = finarr.filter(ell => ell.daysdiff && ell.daysdiff > 0);
  return finfarr;
};

const GetWatchers = async opts => {
  try {
    let watchersList = [];
    let expandViews = [];
    const DbData = await watchersModel.GetWatchersFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        expandViews.push({ repo: data.repo, list: data.list });
        watchersList = watchersList.concat(data.list);
      });
    } else {
      [watchersList, expandViews] = await cards.GetWatchersList(opts);
    }
    watchersList = watchersList.filter(dd => dd.date >= opts.from && dd.date <= opts.upto);
    let count = 0;
    expandViews.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        expand.list[i].cumulative = expand.list[i].count;
      }
      const totalCount = [];
      const filtered = expand.list.filter(dd => dd.date >= opts.from && dd.date <= opts.upto);
      filtered.forEach(watch => {
        totalCount.push(watch.count);
      });
      if (totalCount.length) count += Math.max(...totalCount);
      return true;
    });
    const expandView = JSON.stringify(expandViews);
    watchersList.map(watch => {
      watch.date = watch.date.split('T')[0];
      return true;
    });
    const statChart = await GroupByDate(watchersList, 'date');
    const values = Object.values(statChart);
    const statPoint = [];
    values.forEach(val => {
      statPoint.push(val.length);
    });
    const statistic = [];
    if (statPoint.length >= 1) {
      statistic.push(statPoint[0]);
      for (let i = 1; i < statPoint.length; i += 1) {
        statistic.push(Math.abs(statPoint[i - 1] - statPoint[i]));
      }
    }
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    opts.metric = 'watch';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(JSON.parse(expandView), opts);
      const weekViews = Views.GetWeeksView(JSON.parse(expandView), opts);
      const monthViews = Views.GetMonthsView(JSON.parse(expandView), opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(JSON.parse(expandView), opts);
    }
    const result = Object.assign({
      count,
      statistic,
      dayView,
      weekView,
      monthView,
      tableView
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetStargazers = async opts => {
  try {
    let stargazersList = [];
    let expandViews = [];
    const DbData = await staredModel.GetStaredFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        stargazersList = stargazersList.concat(data.list);
        expandViews.push({ repo: data.repo, list: data.list });
      });
      if (stargazersList.length < 1) {
        [stargazersList, expandViews] = await cards.GetStargazersList(opts);
      }
    } else {
      [stargazersList, expandViews] = await cards.GetStargazersList(opts);
    }
    stargazersList = stargazersList.filter(el => el.starred_at !== null && el.starred_at >= opts.from && el.starred_at <= opts.upto);
    expandViews.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.starred_at) - new Date(b.starred_at));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = 1;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + 1;
        }
      }
      return true;
    });
    const expandView = JSON.stringify(expandViews);
    stargazersList.map(star => {
      star.starred_at = star.starred_at.split('T')[0];
      return true;
    });
    const statChart = await GroupByDate(stargazersList, 'starred_at');
    const statistic = [];
    const values = Object.values(statChart);
    for (let i = 0; i < values.length; i += 1) {
      statistic.push(values[i].length);
    }
    stargazersList.forEach(v => {
      delete v.starred_at;
    });
    stargazersList = Array.from(new Set(stargazersList.map(JSON.stringify))).map(JSON.parse);
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    opts.metric = 'star';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(JSON.parse(expandView), opts);
      const weekViews = Views.GetWeeksView(JSON.parse(expandView), opts);
      const monthViews = Views.GetMonthsView(JSON.parse(expandView), opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(JSON.parse(expandView), opts);
    }
    const result = Object.assign({
      count: stargazersList.length,
      statistic,
      dayView,
      weekView,
      monthView,
      tableView
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const findMinResTime = async (res, issueCommentsList, opts) => {
  const actlprLists = [...res];
  let finArr = [];
  actlprLists.forEach(prLists => {
    prLists.list.forEach(prlst => {
      const actisscomm = issueCommentsList.filter(el => prLists.repo === el.repo);
      const isscomms = actisscomm.length > 0 ? actisscomm[0].list.filter(el => prlst.number === el.number) : [];
      const sortcomments = isscomms.length > 1 ? isscomms.sort((a, b) => new Date(a.date) - new Date(b.date)) : [...isscomms];
      const commentVal = sortcomments.length > 0 ? sortcomments[0].date : null;
      const minarr = prlst.merged_at ? [prlst.merged_at, prlst.closed_at, commentVal] : [prlst.closed_at, commentVal];
      const rmnull = [];
      minarr.forEach(data => {
        if (data !== null) {
          rmnull.push(new Date(data));
        }
      });
      const minDate = rmnull.length > 1 ? rmnull.sort((a, b) => new Date(a) - new Date(b)) : [...rmnull];
      if (minDate.length > 0) {
        prlst.resLatTime = minDate[0];
      }
    });
    const filterDate = prLists.list.filter(el => el.created_at !== null && el.created_at >= opts.since && el.created_at <= opts.until);
    finArr = finArr.concat(filterDate);
  });
  return finArr;
};

const GetIssueComments = async opts => {
  try {
    let issueCommentsList = [];
    let issuesList = [];
    let expandViews = [];
    let prLists = [];
    let count = 0;
    let issuelstwithexpand = [];
    let prlstwithexpand = [];
    const DbPRData = await pullrequestModel.GetPullsFromDB(opts);
    if (DbPRData && DbPRData.length && DbPRData[0] !== null) {
      DbPRData.forEach(data => {
        prLists = prLists.concat(data.list);
        prlstwithexpand.push({ repo: data.repo, list: data.list });
      });
    } else {
      [prLists, prlstwithexpand] = await cards.GetPRList(opts);
    }
    const DbIssuesData = await issuesModel.GetIssuesFromDB(opts);
    const DbCommentsData = await commentsModel.GetCommentsFromDB(opts);
    if (DbIssuesData && DbCommentsData && DbIssuesData.length && DbCommentsData.length && DbIssuesData[0] !== null && DbCommentsData[0] !== null) {
      DbCommentsData.forEach(data => {
        issueCommentsList = issueCommentsList.concat(data.list);
        expandViews.push({ repo: data.repo, list: data.list });
      });
      DbIssuesData.forEach(data => {
        issuesList = issuesList.concat(data.list);
        issuelstwithexpand.push({ repo: data.repo, list: data.list });
      });
    } else {
      const getComments = cards.GetCommentsList(opts);
      const getIssues = cards.GetIssuesList(opts);
      [[issueCommentsList, expandViews], [issuesList, issuelstwithexpand]] = await Promise.all([getComments, getIssues]);
    }
    const cmmtslstwithexpand = [...expandViews];
    issuesList = issuesList.filter(el => el.date !== null && el.date >= opts.since && el.date <= opts.until);
    issueCommentsList = issueCommentsList.filter(el => el.date !== null && el.date >= opts.since && el.date <= opts.until);
    prLists = prLists.filter(el => el.created_at !== null && el.created_at >= opts.since && el.created_at <= opts.until);
    const prLatTimeF = findMinResTime([...prlstwithexpand], cmmtslstwithexpand, opts);
    const issueLatTimeF = findMinResTime([...issuelstwithexpand], cmmtslstwithexpand, opts);
    const [prLatTime, issueLatTime] = await Promise.all([prLatTimeF, issueLatTimeF]);
    const prWithLatTime = prLatTime.filter(itmm => itmm.resLatTime !== undefined);
    const issueWithLatTime = issueLatTime.filter(itmm => itmm.resLatTime !== undefined);
    const prCmtListF = prWithLatTime.length > 0 ? cards.openprChartRes(prWithLatTime, 'cmt') : [];
    const issueCmtListF = issueWithLatTime.length > 0 ? cards.openprChartRes(issueWithLatTime, 'cmt') : [];
    const [prCmtList, issueCmtList] = await Promise.all([prCmtListF, issueCmtListF]);
    const sortedPRCmtList = prCmtList.sort((a, b) => new Date(a.createddate) - new Date(b.createddate));
    const sortedIssueCmtList = issueCmtList.sort((a, b) => new Date(a.createddate) - new Date(b.createddate));
    const prResponseLatencyWeekF = RangeFilterChart([...sortedPRCmtList], opts, 'createddate');
    const issueResponseLatencyWeekF = RangeFilterChart([...sortedIssueCmtList], opts, 'createddate');
    const prResponseLatencyMonthF = RangeFilterChart([...sortedPRCmtList], opts, 'createddate', 'bymonth');
    const issueResponseLatencyMonthF = RangeFilterChart([...sortedIssueCmtList], opts, 'createddate', 'bymonth');
    const openprStillFn = cards.openStill(prLists);
    const openissStillFn = cards.openStill(issuesList);
    const [prResponseLatencyWeek, issueResponseLatencyWeek, prResponseLatencyMonth, issueResponseLatencyMonth, openprStill, openissStill] = await Promise.all([
      prResponseLatencyWeekF,
      issueResponseLatencyWeekF,
      prResponseLatencyMonthF,
      issueResponseLatencyMonthF,
      openprStillFn,
      openissStillFn
    ]);
    const openIssues = issuesList.filter(issue => issue.state === 'open');
    /* eslint-disable no-restricted-syntax */
    for (const issue of openIssues) {
      let openIssueComments = issueCommentsList.filter(comment => comment.number === issue.number);
      openIssueComments = openIssueComments.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (openIssueComments.length) {
        if (issue.author === openIssueComments[0].author) count += 1;
      } else {
        count += 1;
      }
    }
    expandViews.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = 1;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + 1;
        }
      }
      return true;
    });
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    opts.metric = 'comment';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(expandViews, opts);
      const weekViews = Views.GetWeeksView(expandViews, opts);
      const monthViews = Views.GetMonthsView(expandViews, opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(expandViews, opts);
    }
    const result = Object.assign({
      count,
      dayView,
      weekView,
      monthView,
      tableView,
      openPrsArr: openprStill,
      openIssuesArr: openissStill,
      prcount: prLists.filter(el => el.state === 'open').length,
      issuecount: issuesList.filter(el => el.state === 'open').length,
      bydayView: {
        prResponseLatency: [...sortedPRCmtList],
        issueResponseLatency: [...sortedIssueCmtList]
      },
      byweekView: {
        prResponseLatency: prResponseLatencyWeek,
        issueResponseLatency: issueResponseLatencyWeek
      },
      bymonthView: {
        prResponseLatency: prResponseLatencyMonth,
        issueResponseLatency: issueResponseLatencyMonth
      }
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetIssueByLabel = async opts => {
  try {
    let tableViews = [];
    let issuesList = [];
    const DbData = await issuesModel.GetIssuesFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        issuesList = issuesList.concat(data.list);
        tableViews.push({ repo: data.repo, list: data.list });
      });
      if (tableViews.length < 1) {
        [issuesList, tableViews] = await cards.GetIssuesList(opts);
      }
    } else {
      [issuesList, tableViews] = await cards.GetIssuesList(opts);
    }
    tableViews.map(table => {
      table.list = table.list.filter(el => el.date !== null && el.date >= opts.since && el.date <= opts.until);
      return true;
    });
    issuesList = issuesList.filter(el => el.date !== null && el.date >= opts.since && el.date <= opts.until);
    let labelList = [];
    issuesList.forEach(issue => {
      labelList = labelList.concat(issue.labels);
    });
    labelList = labelList.filter((val, index) => labelList.indexOf(val) === index);
    const tableView = [];
    tableViews.forEach(repoData => {
      const dataObj = Object.assign({
        repo: repoData.repo,
        count: repoData.list.length,
        list: []
      });
      /* eslint-disable no-restricted-syntax */
      for (const label of labelList) {
        const Obj = {};
        Obj.name = label;
        const filtered = repoData.list.filter(issue => issue.labels.includes(label));
        Obj.count = filtered.length;
        if (Obj.count > 0) dataObj.list.push(Obj);
      }
      const nonLabel = repoData.list.filter(issue => issue.labels.length < 1);
      if (nonLabel.length) dataObj.list.push({ name: 'no-label', count: nonLabel.length });
      tableView.push(dataObj);
    });
    const result = Object.assign({
      count: issuesList.length,
      tableView
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetMembersList = async opts => {
  try {
    let contributorsList = [];
    let membersList = [];
    let tableViews = [];
    const DbContributorsData = await contributorsModel.GetContributorsFromDB(opts);
    const DbMembersData = await membersModel.GetMembersListFromDB();
    if (DbContributorsData && DbContributorsData.length && DbContributorsData[0] !== null && DbMembersData && DbMembersData.members) {
      DbContributorsData.forEach(data => {
        contributorsList = contributorsList.concat(data.list);
        tableViews.push({ repo: data.repo, list: data.list });
      });
      membersList = DbMembersData.members;
      if (contributorsList.length < 1) {
        const getContributors = cards.GetContributorsList(opts);
        const getMembers = cards.GetMembersList();
        [[contributorsList, tableViews], membersList] = await Promise.all([getContributors, getMembers]);
      }
    } else {
      const getContributors = cards.GetContributorsList(opts);
      const getMembers = cards.GetMembersList();
      [[contributorsList, tableViews], membersList] = await Promise.all([getContributors, getMembers]);
    }
    const tableView = [];
    tableViews.forEach(repoData => {
      const dataObj = Object.assign({
        repo: repoData.repo,
        list: []
      });
      /* eslint-disable no-restricted-syntax */
      for (const user of repoData.list) {
        const filtered = membersList.filter(member => member === user.login);
        if (filtered.length < 1) {
          dataObj.list.push(user);
        }
      }
      tableView.push(dataObj);
    });
    const result = Object.assign({
      count: contributorsList.length,
      tableView
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetIssues = async opts => {
  try {
    let issuesList = [];
    let expandViews = [];
    const DbData = await issuesModel.GetIssuesFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        issuesList = issuesList.concat(data.list);
        expandViews.push({ repo: data.repo, list: data.list });
      });
      if (issuesList.length < 1) {
        [issuesList, expandViews] = await cards.GetIssuesList(opts);
      }
    } else {
      [issuesList, expandViews] = await cards.GetIssuesList(opts);
    }
    expandViews.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = 1;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + 1;
        }
      }
      return true;
    });
    issuesList = issuesList.filter(el => el.date !== null && el.date >= opts.since && el.date <= opts.until);
    const closedDateCond = issuesList.filter(el => el.closed_at !== null && el.closed_at >= opts.since && el.closed_at <= opts.until);
    const open = issuesList.filter(issue => issue.state === 'open');
    const closedissuesF = cards.closedprChartRes(closedDateCond);
    const openissuesF = cards.openprChartRes(open);
    const [closedissues, openissues] = await Promise.all([closedissuesF, openissuesF]);
    const sortedArrclosed = closedissues.sort((a, b) => new Date(a.closeddate) - new Date(b.closeddate));
    const sortedArropen = openissues.sort((a, b) => new Date(a.createddate) - new Date(b.createddate));
    opts.metric = 'issue';
    const weekwisechartclosed1 = RangeFilterChart(sortedArrclosed, opts, 'closeddate');
    const weekwisechartopen1 = RangeFilterChart(sortedArropen, opts, 'createddate');
    const monthwisechartclosed1 = RangeFilterChart(sortedArrclosed, opts, 'closeddate', 'bymonth');
    const monthwisechartopen1 = RangeFilterChart(sortedArropen, opts, 'createddate', 'bymonth');
    const [weekwisechartclosed, weekwisechartopen, monthwisechartclosed, monthwisechartopen] = await Promise.all([
      weekwisechartclosed1,
      weekwisechartopen1,
      monthwisechartclosed1,
      monthwisechartopen1
    ]);
    const byweekView = {
      closedIssue: weekwisechartclosed,
      openIssue: [],
      openedIssue: weekwisechartopen
    };
    const bymonthView = {
      closedIssue: monthwisechartclosed,
      openIssue: [],
      openedIssue: monthwisechartopen
    };
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(expandViews, opts);
      const weekViews = Views.GetWeeksView(expandViews, opts);
      const monthViews = Views.GetMonthsView(expandViews, opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(expandViews, opts);
    }
    const result = Object.assign({
      total: issuesList.length,
      open: open.length,
      close: issuesList.length - open.length,
      bydayView: {
        closedIssue: sortedArrclosed,
        openIssue: [],
        openedIssue: sortedArropen
      },
      avgType: closedissues.length > 20 || openissues.length > 20 ? 'withyear' : '',
      byweekView,
      bymonthView,
      dayView,
      weekView,
      monthView,
      tableView
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetCommits = async opts => {
  try {
    let commitsList = [];
    let expandViews = [];
    const DbData = await commitsModel.GetCommitsFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        commitsList = commitsList.concat(data.list);
        expandViews.push({ repo: data.repo, list: data.list });
      });
      if (commitsList.length < 1) {
        [commitsList, expandViews] = await cards.GetCommitsList(opts);
      }
    } else {
      [commitsList, expandViews] = await cards.GetCommitsList(opts);
    }
    commitsList = commitsList.filter(el => el.date !== null && el.date >= opts.since && el.date <= opts.until);
    const orgs = [];
    commitsList.forEach(orgdata => {
      orgs.push(orgdata.email.split('@')[1]);
    });
    let uniqorg = orgs.filter((val, index) => orgs.indexOf(val) === index);
    uniqorg = uniqorg.filter(org => org);
    let unilen = uniqorg.length;
    // eslint-disable-next-line no-plusplus
    while (unilen--) {
      if (uniqorg[unilen].includes('github.com') || uniqorg[unilen].includes('seagate.com')) {
        uniqorg.splice(unilen, 1);
      }
    }
    const internalUsers = [];
    const externalUsers = [];
    commitsList.forEach(commit => {
      if (commit.email.includes('github.com') || commit.email.includes('seagate.com')) {
        internalUsers.push(commit.name);
      } else {
        externalUsers.push(commit.name);
      }
    });
    const internal = internalUsers.filter((val, index) => internalUsers.indexOf(val) === index);
    const external = externalUsers.filter((val, index) => externalUsers.indexOf(val) === index);
    expandViews.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = 1;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + 1;
        }
      }
      return true;
    });
    const expandView = JSON.stringify(expandViews);
    commitsList.map(commit => {
      commit.date = commit.date.split('T')[0];
      return true;
    });
    const statChart = await GroupByDate(commitsList, 'date');
    const statistic = [];
    const orgStatistic = [];
    const value = Object.values(statChart);
    for (let i = 0; i < value.length; i += 1) {
      statistic.push(value[i].length);
      let orgStat = [];
      value[i].forEach(orgdata => {
        if (orgdata.email) orgStat.push(orgdata.email.split('@')[1]);
      });
      orgStat = orgStat.filter(org => org);
      let orglen = orgStat.length;
      if (orglen > 0) {
        // eslint-disable-next-line no-plusplus
        while (orglen--) {
          if (orgStat[orglen].includes('github.com') || orgStat[orglen].includes('seagate.com')) {
            orgStat.splice(orglen, 1);
          }
        }
        if (orgStat.length) orgStatistic.push(orgStat.length);
      }
    }
    let organizationDayView = '';
    let contributorsDayView = '';
    let commitsDayView = '';
    let organizationWeekView = '';
    let contributorsWeekView = '';
    let commitsWeekView = '';
    let organizationMonthView = '';
    let contributorsMonthView = '';
    let commitsMonthView = '';
    let organizationTableView = '';
    let contributorsTableView = '';
    let commitsTableView = '';
    opts.metric = 'commit';
    const opts1 = { ...opts };
    const opts2 = { ...opts };
    const opts3 = { ...opts };
    opts1.type = 'org';
    opts2.type = 'author';
    opts3.type = 'commit';
    if (opts.filter) {
      const contributionOrgDV = Views.GetDaysView(JSON.parse(expandView), opts1);
      const contributorsDV = Views.GetDaysView(JSON.parse(expandView), opts2);
      const commitsDV = Views.GetDaysView(JSON.parse(expandView), opts3);
      const contributionOrgWV = Views.GetWeeksView(JSON.parse(expandView), opts1);
      const contributorsWV = Views.GetWeeksView(JSON.parse(expandView), opts2);
      const commitsWV = Views.GetWeeksView(JSON.parse(expandView), opts3);
      const contributionOrgMV = Views.GetMonthsView(JSON.parse(expandView), opts1);
      const contributorsMV = Views.GetMonthsView(JSON.parse(expandView), opts2);
      const commitsMV = Views.GetMonthsView(JSON.parse(expandView), opts3);
      [
        organizationDayView,
        contributorsDayView,
        commitsDayView,
        organizationWeekView,
        contributorsWeekView,
        commitsWeekView,
        organizationMonthView,
        contributorsMonthView,
        commitsMonthView
      ] = await Promise.all([
        contributionOrgDV,
        contributorsDV,
        commitsDV,
        contributionOrgWV,
        contributorsWV,
        commitsWV,
        contributionOrgMV,
        contributorsMV,
        commitsMV
      ]);
    } else {
      opts2.table = true;
      const contributionTV = Views.GetTableView(JSON.parse(expandView), opts1);
      const contributorsTV = Views.GetTableView(JSON.parse(expandView), opts2);
      const commitsTV = Views.GetTableView(JSON.parse(expandView), opts3);
      [organizationTableView, contributorsTableView, commitsTableView] = await Promise.all([contributionTV, contributorsTV, commitsTV]);
    }
    const result = Object.assign({
      commits: {
        count: commitsList.length,
        statistic,
        dayView: commitsDayView,
        weekView: commitsWeekView,
        monthView: commitsMonthView,
        tableView: commitsTableView
      },
      contributionOrg: {
        count: uniqorg.length,
        uniqorgs: uniqorg,
        statistic: orgStatistic,
        dayView: organizationDayView,
        weekView: organizationWeekView,
        monthView: organizationMonthView,
        tableView: organizationTableView
      },
      contributors: {
        total: internal.length + external.length,
        internal: internal.length,
        external: external.length,
        dayView: contributorsDayView,
        weekView: contributorsWeekView,
        monthView: contributorsMonthView,
        tableView: contributorsTableView
      }
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetClones = async opts => {
  try {
    let unique = 0;
    let clonesList = [];
    let expandView = [];
    const createdAt = [];
    const DbData = await clonesModel.GetClonesFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        clonesList = clonesList.concat(data.list);
        expandView.push({ repo: data.repo, list: data.list });
      });
      if (clonesList.length < 1) {
        [clonesList, expandView] = await cards.GetClonesList(opts);
      }
    } else {
      [clonesList, expandView] = await cards.GetClonesList(opts);
    }
    clonesList.forEach(clone => {
      createdAt.push(clone.date);
    });
    let minDate = createdAt.filter((val, index) => createdAt.indexOf(val) === index);
    minDate = minDate.sort((a, b) => new Date(a) - new Date(b));
    clonesList = clonesList.filter(el => el.date !== null && el.date >= opts.from && el.date <= opts.upto);
    clonesList.forEach(clone => {
      unique += clone.uniques;
    });
    expandView.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = expand.list[i].count;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + expand.list[i].count;
        }
      }
      return true;
    });
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    opts.metric = 'clone';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(expandView, opts);
      const weekViews = Views.GetWeeksView(expandView, opts);
      const monthViews = Views.GetMonthsView(expandView, opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(expandView, opts);
    }
    const result = Object.assign({
      count: unique,
      dayView,
      weekView,
      monthView,
      tableView,
      createdAt: minDate[0]
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetReleases = async opts => {
  try {
    let releaseList = [];
    let expandView = [];
    const DbData = await releaseModel.GetReleaseFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        expandView.push({ repo: data.repo, list: data.list });
        releaseList = releaseList.concat(data.list);
      });
    } else {
      [releaseList, expandView] = await cards.GetReleasesList(opts);
    }
    releaseList = releaseList.filter(dd => dd.date >= opts.from && dd.date <= opts.upto);
    let count = 0;
    expandView.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        expand.list[i].cumulative = expand.list[i].count;
      }
      const totalCount = [];
      const filtered = expand.list.filter(dd => dd.date >= opts.from && dd.date <= opts.upto);
      filtered.forEach(release => {
        totalCount.push(release.count);
      });
      if (totalCount.length) count += Math.max(...totalCount);
      return true;
    });
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    if (opts.filter) {
      opts.metric = 'release';
      const dayViews = Views.GetDaysView(expandView, opts);
      const weekViews = Views.GetWeeksView(expandView, opts);
      const monthViews = Views.GetMonthsView(expandView, opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(expandView, opts);
    }
    const result = Object.assign({
      count,
      dayView,
      weekView,
      monthView,
      tableView
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetPullRequests = async opts => {
  try {
    let prList = [];
    let expandViews = [];
    const DbData = await pullrequestModel.GetPullsFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        prList = prList.concat(data.list);
        expandViews.push({ repo: data.repo, list: data.list });
      });
      if (prList.length < 1) {
        [prList, expandViews] = await cards.GetPRList(opts);
      }
    } else {
      [prList, expandViews] = await cards.GetPRList(opts);
    }
    const pullList = JSON.stringify(prList);
    expandViews.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = 1;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + 1;
        }
      }
      return true;
    });
    const result = await cards.listPRresponse(JSON.parse(pullList), opts);
    const weekwisechartclosed1 = RangeFilterChart(result.bydayView.closedPR, opts, 'closeddate');
    const weekwisechartopen1 = RangeFilterChart(result.bydayView.openPR, opts, 'createddate');
    const monthwisechartclosed1 = RangeFilterChart(result.bydayView.closedPR, opts, 'closeddate', 'bymonth');
    const monthwisechartopen1 = RangeFilterChart(result.bydayView.openPR, opts, 'createddate', 'bymonth');
    const [weekwisechartclosed, weekwisechartopen, monthwisechartclosed, monthwisechartopen] = await Promise.all([
      weekwisechartclosed1,
      weekwisechartopen1,
      monthwisechartclosed1,
      monthwisechartopen1
    ]);
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    opts.metric = 'pull';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(expandViews, opts);
      const weekViews = Views.GetWeeksView(expandViews, opts);
      const monthViews = Views.GetMonthsView(expandViews, opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(expandViews, opts);
    }
    result.dayView = dayView;
    result.weekView = weekView;
    result.monthView = monthView;
    result.byweekView = {
      closedPR: weekwisechartclosed,
      openPR: [],
      openedPR: weekwisechartopen
    };
    result.bymonthView = {
      closedPR: monthwisechartclosed,
      openPR: [],
      openedPR: monthwisechartopen
    };
    result.tableView = tableView;
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetViewDetails = async opts => {
  try {
    let unique = 0;
    let count = 0;
    let viewList = [];
    let expandView = [];
    const createdAt = [];
    const DbData = await viewsModel.GetViewsFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        viewList = viewList.concat(data.list);
        expandView.push({ repo: data.repo, list: data.list });
      });
      if (viewList.length < 1) {
        [viewList, expandView] = await cards.GetViewList(opts);
      }
    } else {
      [viewList, expandView] = await cards.GetViewList(opts);
    }
    viewList.forEach(view => {
      createdAt.push(view.date);
    });
    let minDate = createdAt.filter((val, index) => createdAt.indexOf(val) === index);
    minDate = minDate.sort((a, b) => new Date(a) - new Date(b));
    viewList = viewList.filter(el => el.date !== null && el.date >= opts.from && el.date <= opts.upto);
    expandView.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = expand.list[i].count;
          expand.list[i].cumulativeUnique = expand.list[i].uniques;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + expand.list[i].count;
          expand.list[i].cumulativeUnique = expand.list[i - 1].cumulativeUnique + expand.list[i].uniques;
        }
      }
      return true;
    });
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    opts.metric = 'view';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(expandView, opts);
      const weekViews = Views.GetWeeksView(expandView, opts);
      const monthViews = Views.GetMonthsView(expandView, opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(expandView, opts);
    }
    const visitStatistic = [];
    const visitorsStatistic = [];
    viewList.forEach(view => {
      count += view.count;
      unique += view.uniques;
      visitStatistic.push(view.count);
      visitorsStatistic.push(view.uniques);
    });
    const result = Object.assign({
      visits: count,
      visitors: unique,
      visitStatistic,
      visitorsStatistic,
      dayView,
      weekView,
      monthView,
      tableView,
      createdAt: minDate[0]
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetEvents = async opts => {
  try {
    let eventList = [];
    let expandViews = [];
    const DbData = await actionsModel.GetActionsFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        eventList = eventList.concat(data.list);
        expandViews.push({ repo: data.repo, list: data.list });
      });
      if (eventList.length < 1) {
        [eventList, expandViews] = await cards.GetEventsList(opts);
      }
    } else {
      [eventList, expandViews] = await cards.GetEventsList(opts);
    }
    eventList = eventList.filter(el => el.date !== null && el.date >= opts.from && el.date <= opts.upto);
    expandViews.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = 1;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + 1;
        }
      }
      return true;
    });
    const expandView = JSON.stringify(expandViews);
    let actor = [];
    eventList.map(event => {
      actor.push(event.actor);
      event.date = event.date.split('T')[0];
      return true;
    });
    const statChart = await GroupByDate(eventList, 'date');
    let statistic = [];
    const values = Object.values(statChart);
    for (let i = 0; i < values.length; i += 1) {
      statistic.push(values[i].length);
    }
    statistic = statistic.reverse();
    actor = actor.filter((val, index) => actor.indexOf(val) === index);
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    opts.metric = 'event';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(JSON.parse(expandView), opts);
      const weekViews = Views.GetWeeksView(JSON.parse(expandView), opts);
      const monthViews = Views.GetMonthsView(JSON.parse(expandView), opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(JSON.parse(expandView), opts);
    }
    const result = Object.assign({
      count: actor.length,
      statistic,
      dayView,
      weekView,
      monthView,
      tableView
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

const GetForks = async opts => {
  try {
    let forksList = [];
    let expandViews = [];
    const DbData = await forksModel.GetForksFromDB(opts);
    if (DbData && DbData.length && DbData[0] !== null) {
      DbData.forEach(data => {
        forksList = forksList.concat(data.list);
        expandViews.push({ repo: data.repo, list: data.list });
      });
      if (forksList.length < 1) {
        [forksList, expandViews] = await cards.GetForksList(opts);
      }
    } else {
      [forksList, expandViews] = await cards.GetForksList(opts);
    }
    forksList = forksList.filter(el => el.date !== null && el.date >= opts.from && el.date <= opts.upto);
    expandViews.map(expand => {
      expand.list = expand.list.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < expand.list.length; i += 1) {
        if (i === 0) {
          expand.list[i].cumulative = expand.list[i].count + 1;
        } else {
          expand.list[i].cumulative = expand.list[i - 1].cumulative + expand.list[i].count + 1;
        }
      }
      return true;
    });
    let dayView = '';
    let weekView = '';
    let monthView = '';
    let tableView = '';
    opts.metric = 'fork';
    if (opts.filter) {
      const dayViews = Views.GetDaysView(expandViews, opts);
      const weekViews = Views.GetWeeksView(expandViews, opts);
      const monthViews = Views.GetMonthsView(expandViews, opts);
      [dayView, weekView, monthView] = await Promise.all([dayViews, weekViews, monthViews]);
    } else {
      tableView = await Views.GetTableView(expandViews, opts);
    }
    let count = forksList.length;
    forksList.forEach(fork => {
      if (fork.count > 0) {
        count += fork.count;
      }
    });
    forksList.map(fork => {
      fork.date = fork.date.split('T')[0];
      return true;
    });
    const statChart = await GroupByDate(forksList, 'date');
    const statistic = [];
    const values = Object.values(statChart);
    for (let i = 0; i < values.length; i += 1) {
      statistic.push(values[i].length);
    }
    const result = Object.assign({
      count,
      statistic,
      dayView,
      weekView,
      monthView,
      tableView
    });
    return result;
  } catch (exc) {
    Logger.log('error', exc);
    return exc;
  }
};

module.exports = {
  GetWatchers,
  GetStargazers,
  GetIssues,
  GetCommits,
  GetClones,
  GetReleases,
  GetPullRequests,
  GetViewDetails,
  GetEvents,
  GetForks,
  GetIssueComments,
  GetIssueByLabel,
  GetMembersList
};
