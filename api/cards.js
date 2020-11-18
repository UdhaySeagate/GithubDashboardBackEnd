/**
 * API file to handle all the Jira API calls
 */
const request = require('request-promise');
const dotenv = require('dotenv');
const { Logger } = require('../helpers/index');

dotenv.config();

/* eslint-disable-next-line new-cap */
const AccessToken = `Basic ${new Buffer.from(`${process.env.GITHUB_USERNAME}:${process.env.GITHUB_PASSWORD}`).toString('base64')}`;

const median = values => {
  values.sort((a, b) => {
    return a - b;
  });
  const half = Math.floor(values.length / 2);
  let result;
  if (values.length % 2) {
    result = values[half];
  } else {
    result = (values[half - 1] + values[half]) / 2.0;
  }
  return result;
};

const sliceArrVal = (arrVal, prtype, dateType) => {
  const resarr = [...arrVal];
  const uniqueMonth = [...new Set(resarr.map(item => item.monthyear))];
  const uniqueYear = [...new Set(resarr.map(item => item.year))];
  const sliceArr = [];
  const selectArr = dateType === 'Month' ? [...uniqueMonth] : [...uniqueYear];
  const selectType = dateType === 'Month' ? 'monthyear' : 'year';
  const selecrPR = prtype === 'close' ? 'closeddate' : 'createddate';
  selectArr.forEach(data => {
    let hrscount = 0;
    let prcountv = 0;
    const minmaxDays = [];
    const dateCond = resarr.filter(el => el[selectType] === data);
    dateCond.forEach(itm => {
      minmaxDays.push(parseInt(itm.avgdays, 10));
      hrscount += parseInt(itm.avgdays, 10);
      prcountv += itm.prcount;
    });
    const resVal = {
      avgdays: Math.round((hrscount / dateCond.length + Number.EPSILON) * 100) / 100,
      prcount: prcountv,
      min: minmaxDays.length > 0 ? Math.min(...minmaxDays) : 0,
      max: minmaxDays.length > 0 ? Math.max(...minmaxDays) : 0,
      medianVal: median(minmaxDays)
    };
    resVal[selecrPR] = data;
    sliceArr.push(resVal);
  });
  return sliceArr;
};

const closedprChartRes = async res => {
  const prList = [...res];
  const filtCreated = prList.filter(ele => ele.closed_at && ele.closed_at !== null);
  const resultChart = [];
  const date = [];
  filtCreated.forEach(data => {
    const dateFormat = data.closed_at.split('T')[0];
    date.push(dateFormat);
  });
  const rmvDupDate = date.filter((val, index) => date.indexOf(val) === index);
  rmvDupDate.forEach(itmm => {
    const closedAt = [];
    const dtfil = filtCreated.filter(el => el.closed_at.split('T')[0] === itmm);
    let hrs = 0;
    let mins = 0;
    dtfil.forEach(it => {
      const hours = Math.abs(new Date(it.closed_at) - new Date(it.created_at)) / 36e5;
      const diffMs = new Date(it.closed_at) - new Date(it.created_at);
      const diffMins = Math.round(diffMs / 1000 / 60);
      hrs += hours;
      mins += diffMins;
      closedAt.push(it.closed_at);
    });
    let hrsavg = 0;
    let minsavg = 0;
    if (hrs > 0) {
      hrsavg = hrs / dtfil.length;
    }
    if (mins > 0) {
      minsavg = mins / dtfil.length;
    }
    let closedDate = '';
    if (closedAt.length) {
      closedDate = closedAt[0];
    }
    const monyr = itmm.split('-');
    const yr = itmm.split('-');
    monyr.splice(-1, 1);
    yr.splice(-2, 2);
    const chartVal = {
      closeddate: closedDate,
      avgdays: hrsavg,
      prcount: dtfil.length,
      monthyear: monyr.join('-'),
      year: yr.join('-'),
      avgmins: minsavg
    };
    resultChart.push(chartVal);
  });
  return resultChart;
};

const openprChartRes = async (res, cmt = '') => {
  const prList = [...res];
  const resultChart = [];
  const date = [];
  prList.forEach(data => {
    const dateFormat = data.created_at.split('T')[0];
    date.push(dateFormat);
  });
  const rmvDupDate = date.filter((val, index) => date.indexOf(val) === index);
  rmvDupDate.forEach(itmm => {
    const createdAt = [];
    const dtfil = prList.filter(el => el.created_at.split('T')[0] === itmm);
    let hrs = 0;
    let mins = 0;
    const hrsArr = [];
    if (cmt === 'cmt') {
      dtfil.forEach(it => {
        const hours = Math.abs(new Date(it.resLatTime) - new Date(it.created_at)) / 36e5;
        const diffMs = new Date(it.resLatTime) - new Date(it.created_at);
        const diffMins = Math.round(diffMs / 1000 / 60);
        hrsArr.push(hours);
        hrs += hours;
        mins += diffMins;
        createdAt.push(it.created_at);
      });
    } else {
      dtfil.forEach(it => {
        const hours = Math.abs(new Date() - new Date(it.created_at)) / 36e5;
        hrsArr.push(hours);
        hrs += hours;
        createdAt.push(it.created_at);
      });
    }
    const minhrs = hrsArr.length > 0 ? Math.min(...hrsArr) : 0;
    const maxhrs = hrsArr.length > 0 ? Math.max(...hrsArr) : 0;
    let hrsavg = 0;
    let minsavg = 0;
    if (hrs > 0) {
      hrsavg = hrs / dtfil.length;
    }
    if (mins > 0) {
      minsavg = mins / dtfil.length;
    }
    let createdDate = '';
    if (createdAt.length) {
      createdDate = createdAt[0];
    }
    const monyr = itmm.split('-');
    const yr = itmm.split('-');
    monyr.splice(-1, 1);
    yr.splice(-2, 2);
    const chartVal = {
      createddate: createdDate,
      avgdays: hrsavg,
      prcount: dtfil.length,
      monthyear: monyr.join('-'),
      year: yr.join('-'),
      avgmins: minsavg,
      min: Math.round((maxhrs / 24 + Number.EPSILON) * 100) / 100,
      max: Math.round((minhrs / 24 + Number.EPSILON) * 100) / 100,
      medianVal: Math.round((median(hrsArr) / 24 + Number.EPSILON) * 100) / 100
    };
    resultChart.push(chartVal);
  });
  return resultChart;
};

const splitRange = (res, splt) => {
  const prs = [...res];
  const splttxt = splt === 'week' ? 'weekcount' : 'monthcount';
  const finalArr = [];
  const uniqdays = [...new Set(prs.map(item => item[splttxt]))];
  uniqdays.forEach(item => {
    const filarr = prs.filter(el => el[splttxt] === item);
    const maxdate = new Date(Math.min(...filarr.map(e => new Date(e.created_at))));
    const uniqobj = {
      openindays: item,
      count: filarr.length,
      categorys: item <= 1 ? `1 ${splt}` : `${item} ${splt}s`,
      category: maxdate
    };
    finalArr.push(uniqobj);
  });
  const filtd = finalArr.sort((a, b) => new Date(a.openindays) - new Date(b.openindays));
  return filtd;
};

const openStill = res => {
  let finalArr = [];
  const prList = [...res].filter(el => el.state === 'open');
  prList.map(itm => {
    itm.openhrsindays = Math.round(Math.abs(new Date() - new Date(itm.created_at)) / 36e5 / 24);
    itm.weekcount = Math.ceil(Math.round(Math.abs(new Date() - new Date(itm.created_at)) / 36e5 / 24) / 7);
    itm.monthcount = Math.ceil(Math.round(Math.abs(new Date() - new Date(itm.created_at)) / 36e5 / 24) / 30);
    return true;
  });
  const uniqdays = [...new Set(prList.map(item => item.openhrsindays))];
  uniqdays.forEach(item => {
    const filarr = prList.filter(el => el.openhrsindays === item);
    const uniqobj = {
      openindays: item,
      count: filarr.length,
      categorys: item <= 1 ? `1 day` : `${item} days`
    };
    finalArr.push(uniqobj);
  });
  finalArr = finalArr.sort((a, b) => new Date(a.openindays) - new Date(b.openindays));
  const weekwiseData = splitRange(prList, 'week');
  const monthwiseData = splitRange(prList, 'month');
  const result = {
    byDayView: [...finalArr],
    byWeekView: [...weekwiseData],
    byMonthView: [...monthwiseData]
  };
  return result;
};

const listPRresponse = async (res, opts) => {
  const resArr = [...res];
  let dateCond;
  let closedDateCond;
  const from = opts.from;
  const upto = opts.upto;
  if (from && upto) {
    closedDateCond = resArr.filter(el => el.closed_at !== null && el.closed_at >= from && el.closed_at <= upto);
    dateCond = resArr.filter(el => el.created_at !== null && el.created_at >= from && el.created_at <= upto);
  } else if (from) {
    closedDateCond = resArr.filter(el => el.closed_at !== null && el.closed_at >= from);
    dateCond = resArr.filter(el => el.created_at !== null && el.created_at >= from);
  } else {
    closedDateCond = [...res];
    dateCond = [...res];
  }
  const open = dateCond.filter(el => el.state === 'open');
  const merged = dateCond.filter(el => el.merged_at !== null);
  const closedprF = closedprChartRes(closedDateCond);
  const openedprF = openprChartRes(open);
  const [closedpr, openedpr] = await Promise.all([closedprF, openedprF]);
  const sortedArrclosed = closedpr.sort((a, b) => new Date(a.closeddate) - new Date(b.closeddate));
  const sortedArropen = openedpr.sort((a, b) => new Date(a.createddate) - new Date(b.createddate));
  const result = {
    totalpr: dateCond.length,
    openpr: open.length,
    closepr: dateCond.length - open.length,
    mergedpr: merged.length,
    openPrArray: openStill([...dateCond]),
    bydayView: {
      closedPR: sortedArrclosed,
      openPR: [],
      openedPR: sortedArropen
    },
    avgType: closedpr.length > 20 || openedpr.length > 20 ? 'withyear' : ''
  };
  return result;
};

const loopResponse = async (acturl, opts = {}) => {
  let resarr = new Array(100);
  let resdatas = [];
  let i = 1;
  while (resarr.length >= 100) {
    /* eslint-disable no-await-in-loop */
    let geturl = `${acturl}per_page=100&page=${i}`;
    if (opts.since) {
      geturl += `&since=${opts.since}`;
    }
    if (opts.until) {
      geturl += `&until=${opts.until}`;
    }
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
    if (opts.star) {
      options.headers.Accept = 'application/vnd.github.v3.star+json';
    }
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
/* Response changes */

const GetWatchersList = async opts => {
  Logger.log('info', 'Get watchers list from github server');
  const dateTime = new Date();
  const previousDay = dateTime.setDate(dateTime.getDate() - 1);
  const Yesterday = new Date(previousDay).toISOString().split('T')[0];
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/subscribers?`;
    promiseAll.push(loopResponse(urls));
  }
  const resData = await Promise.all(promiseAll);
  const result = [];
  const expandView = [];
  const repoWatch = [];
  for (const data of resData) {
    const expand = [];
    const Obj = Object.assign({
      count: data.length,
      date: `${Yesterday}T00:00:00Z`
    });
    result.push(Obj);
    expand.push(Obj);
    repoWatch.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoWatch[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

const GetStargazersList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    /* eslint-disable no-await-in-loop */
    const optss = { ...opts };
    optss.star = true;
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/stargazers?`;
    promiseAll.push(loopResponse(urls, optss));
  }
  const resData = await Promise.all(promiseAll);
  const result = [];
  const expandView = [];
  const repoStars = [];
  for (const data of resData) {
    const expand = [];
    for (const star of data) {
      const Obj = Object.assign({
        id: star.user.id,
        starred_at: star.starred_at,
        login: star.user.login
      });
      result.push(Obj);
      expand.push(Obj);
    }
    repoStars.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoStars[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

const GetCommentsList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/issues/comments?`;
    promiseAll.push(loopResponse(urls, opts));
  }
  const resData = await Promise.all(promiseAll);
  const result = [];
  const expandView = [];
  const repoComments = [];
  for (const data of resData) {
    const expand = [];
    for (const comment of data) {
      const number = comment.issue_url.split('/').pop();
      const Obj = Object.assign({
        id: comment.id,
        number: Number(number),
        author: comment.user.login,
        date: comment.created_at
      });
      result.push(Obj);
      expand.push(Obj);
    }
    repoComments.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoComments[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

const GetMembersList = async () => {
  const urls = `https://${process.env.GITHUB_HOST}/orgs/${process.env.GITHUB_ORG}/members?`;
  const resData = await loopResponse(urls);
  const result = [];
  resData.forEach(data => {
    result.push(data.login);
  });
  return result;
};

const GetContributorsList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/contributors?`;
    promiseAll.push(loopResponse(urls));
  }
  const resData = await Promise.all(promiseAll);
  const result = [];
  const expandView = [];
  const repoContributors = [];
  for (const data of resData) {
    const expand = [];
    for (const contributors of data) {
      const Obj = Object.assign({
        name: contributors.login,
        contributions: contributors.contributions
      });
      result.push(Obj);
      expand.push(Obj);
    }
    repoContributors.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoContributors[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

const GetIssuesList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/issues?state=all&`;
    promiseAll.push(loopResponse(urls, opts));
  }
  const resData = await Promise.all(promiseAll);
  const result = [];
  const expandView = [];
  const repoIssues = [];
  for (const data of resData) {
    const filtered = data.filter(res => res.pull_request === undefined);
    const expand = [];
    for (const issue of filtered) {
      const labels = [];
      if (issue.labels && issue.labels.length) {
        issue.labels.forEach(label => {
          labels.push(label.name);
        });
      }
      const Obj = Object.assign({
        id: issue.id,
        state: issue.state,
        number: issue.number,
        labels,
        author: issue.user.login,
        date: issue.created_at,
        created_at: issue.created_at,
        closed_at: issue.closed_at
      });
      result.push(Obj);
      expand.push(Obj);
    }
    repoIssues.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoIssues[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

const GetCommitsList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/commits?`;
    promiseAll.push(loopResponse(urls, opts));
  }
  const resData = await Promise.all(promiseAll);
  const result = [];
  const expandView = [];
  const repoCommits = [];
  for (const data of resData) {
    const expand = [];
    for (const list of data) {
      const Obj = Object.assign({
        name: list.commit.author.name,
        email: list.commit.author.email,
        date: list.commit.author.date
      });
      result.push(Obj);
      expand.push(Obj);
    }
    repoCommits.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoCommits[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

const GetClonesList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  for (const repo of repname) {
    const options = {
      method: 'GET',
      url: `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/traffic/clones`,
      json: true,
      headers: {
        'User-Agent': process.env.GITHUB_USERNAME,
        Authorization: AccessToken
      }
    };
    promiseAll.push(request(options));
  }
  const resData = await Promise.all(promiseAll);
  let result = [];
  const expandView = [];
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: resData[i].clones
    });
    expandView.push(dataObj);
  }
  for (const data of resData) {
    data.clones.map(clone => {
      clone.date = clone.timestamp;
      delete clone.timestamp;
      return true;
    });
    result = result.concat(data.clones);
  }
  return [result, expandView];
};

const GetReleasesList = async opts => {
  const dateTime = new Date();
  const previousDay = dateTime.setDate(dateTime.getDate() - 1);
  const Yesterday = new Date(previousDay).toISOString().split('T')[0];
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/releases?`;
    promiseAll.push(loopResponse(urls, opts));
  }
  const resData = await Promise.all(promiseAll);
  const repoRelease = [];
  const expandView = [];
  const result = [];
  let releaseCount = 0;
  if (resData && resData.length) {
    for (const repoData of resData) {
      let downloadCount = 0;
      const repoDownloads = [];
      for (const data of repoData) {
        if (data.assets && data.assets.length) {
          for (const asset of data.assets) {
            if (asset && asset.download_count) {
              downloadCount += asset.download_count;
              releaseCount += asset.download_count;
            }
          }
        }
      }
      if (downloadCount > 0) {
        const Obj = Object.assign({
          count: downloadCount,
          date: `${Yesterday}T00:00:00Z`
        });
        result.push(Obj);
        repoDownloads.push(Obj);
      }
      repoRelease.push(repoDownloads);
    }
  }
  if (releaseCount > 0) {
    for (let i = 0; i < repname.length; i += 1) {
      const dataObj = Object.assign({
        repo: repname[i],
        list: repoRelease[i]
      });
      expandView.push(dataObj);
    }
  }
  return [result, expandView];
};

const GetPRList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/pulls?state=all&`;
    promiseAll.push(loopResponse(urls));
  }
  const resData = await Promise.all(promiseAll);
  const result = [];
  const expandView = [];
  const repoPulls = [];
  for (const data of resData) {
    const expand = [];
    for (const pulls of data) {
      const obj = Object.assign({
        id: pulls.id,
        state: pulls.state,
        number: pulls.number,
        created_at: pulls.created_at,
        merged_at: pulls.merged_at,
        closed_at: pulls.closed_at
      });
      result.push(obj);
      expand.push(obj);
    }
    repoPulls.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoPulls[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

const GetViewList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  for (const repo of repname) {
    const options = {
      method: 'GET',
      url: `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/traffic/views`,
      json: true,
      headers: {
        'User-Agent': process.env.GITHUB_USERNAME,
        Authorization: AccessToken
      }
    };
    promiseAll.push(request(options));
  }
  const resData = await Promise.all(promiseAll);
  let result = [];
  const expandView = [];
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: resData[i].views
    });
    expandView.push(dataObj);
  }
  for (const data of resData) {
    data.views.map(view => {
      view.date = view.timestamp;
      delete view.timestamp;
      return true;
    });
    result = result.concat(data.views);
  }
  return [result, expandView];
};

const GetEventsList = async opts => {
  const resData = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    let repoData = [];
    for (let i = 1; i <= 3; i += 1) {
      const options = {
        method: 'GET',
        url: `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/events?per_page=100&page=${i}`,
        json: true,
        headers: {
          'User-Agent': process.env.GITHUB_USERNAME,
          Authorization: AccessToken
        }
      };
      const promiseAll = await request(options);
      repoData = repoData.concat(promiseAll);
    }
    resData.push(repoData);
  }
  const result = [];
  const expandView = [];
  const repoEvents = [];
  for (const data of resData) {
    const expand = [];
    for (const list of data) {
      const Obj = Object.assign({
        id: list.id,
        type: list.type,
        actor: list.actor.login,
        date: list.created_at
      });
      result.push(Obj);
      expand.push(Obj);
    }
    repoEvents.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoEvents[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

const GetForksList = async opts => {
  const promiseAll = [];
  const repname = opts.repoName.split(',');
  /* eslint-disable no-restricted-syntax */
  for (const repo of repname) {
    const urls = `https://${process.env.GITHUB_HOST}/repos/${process.env.GITHUB_ORG}/${repo}/forks?`;
    promiseAll.push(loopResponse(urls));
  }
  const resData = await Promise.all(promiseAll);
  const result = [];
  const expandView = [];
  const repoForks = [];
  for (const data of resData) {
    const expand = [];
    for (const fork of data) {
      const Obj = Object.assign({
        id: fork.id,
        name: fork.name,
        full_name: fork.full_name,
        count: fork.forks_count,
        date: fork.created_at
      });
      result.push(Obj);
      expand.push(Obj);
    }
    repoForks.push(expand);
  }
  for (let i = 0; i < repname.length; i += 1) {
    const dataObj = Object.assign({
      repo: repname[i],
      list: repoForks[i]
    });
    expandView.push(dataObj);
  }
  return [result, expandView];
};

module.exports = {
  GetWatchersList,
  GetStargazersList,
  GetCommentsList,
  GetIssuesList,
  GetMembersList,
  GetCommitsList,
  GetClonesList,
  GetReleasesList,
  GetPRList,
  GetViewList,
  GetEventsList,
  GetForksList,
  listPRresponse,
  openprChartRes,
  closedprChartRes,
  sliceArrVal,
  GetContributorsList,
  openStill
};
