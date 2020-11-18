/**
 * Day/Week/Month wise view conversion file
 */

const ConvertCommitsToView = (data, opts) => {
  let count = 0;
  let uniques = 0;
  const cumulative = [];
  if (opts.type === 'org') {
    let orgs = [];
    data.forEach(orgdata => {
      orgs.push(orgdata.email.split('@')[1]);
      cumulative.push(orgdata.cumulative);
    });
    orgs = orgs.filter(org => org);
    let orglen = orgs.length;
    if (orglen > 0) {
      // eslint-disable-next-line no-plusplus
      while (orglen--) {
        if (orgs[orglen].includes('github.com') || orgs[orglen].includes('seagate.com')) {
          orgs.splice(orglen, 1);
        }
      }
    }
    // eslint-disable-next-line no-plusplus
    let uniqorg = orgs.filter((val, index) => orgs.indexOf(val) === index);
    uniqorg = uniqorg.filter(org => org);
    count = orgs.length;
    uniques = uniqorg.length;
  } else if (opts.type === 'author') {
    const actorList = [];
    const internalUsers = [];
    const externalUsers = [];
    data.forEach(val => {
      actorList.push(val.name);
      cumulative.push(val.cumulative);
      if (val.email.includes('github.com') || val.email.includes('seagate.com')) {
        internalUsers.push(val.name);
      } else {
        externalUsers.push(val.name);
      }
    });
    const internal = internalUsers.filter((val, index) => internalUsers.indexOf(val) === index);
    const external = externalUsers.filter((val, index) => externalUsers.indexOf(val) === index);
    const uniqueCount = actorList.filter((val, index) => actorList.indexOf(val) === index);
    if (opts.table) {
      count = {
        total: actorList.length,
        internal,
        external
      };
    } else {
      count = actorList.length;
    }
    uniques = uniqueCount.length;
  } else {
    count = data.length;
    data.forEach(val => {
      cumulative.push(val.cumulative);
    });
  }
  return [count, uniques, cumulative];
};

const GetDaysArray = (start, end) => {
  const dayStart = [];
  let dayEnd = [];
  for (const dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    dayStart.push(new Date(dt).toISOString());
  }
  for (const dtt = new Date(end); dtt >= start; dtt.setDate(dtt.getDate() - 1)) {
    dayEnd.push(new Date(dtt).toISOString());
  }
  dayEnd = dayEnd.sort((a, b) => new Date(a) - new Date(b));
  return [dayStart, dayEnd];
};

const GetDaysList = async opts => {
  const dateFrom = opts.from ? opts.from : opts.since;
  const dateTo = opts.upto ? opts.upto : opts.until;
  const [daysStart, daysEnd] = GetDaysArray(new Date(dateFrom), new Date(dateTo));
  return [daysStart, daysEnd];
};

const GetDaysView = async (expandViews, opts) => {
  const [daysStart, daysEnd] = await GetDaysList(opts);
  const daysView = [];
  expandViews.forEach(async exList => {
    const daywise = {
      repo: exList.repo,
      list: []
    };
    if (exList.list.length) {
      if (opts.metric === 'star') {
        daywise.date = exList.list[0].starred_at;
      } else if (opts.metric === 'pull') {
        daywise.date = exList.list[0].created_at;
      } else {
        daywise.date = exList.list[0].date;
      }
    }
    for (let index = 0; index < daysStart.length; index += 1) {
      let filtered = [];
      let cumulative = [];
      if (opts.metric === 'star') {
        filtered = exList.list.filter(list => new Date(list.starred_at) >= new Date(daysStart[index]) && new Date(list.starred_at) <= new Date(daysEnd[index]));
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.starred_at) <= new Date(daysEnd[index]));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      } else if (opts.metric === 'pull') {
        filtered = exList.list.filter(list => new Date(list.created_at) >= new Date(daysStart[index]) && new Date(list.created_at) <= new Date(daysEnd[index]));
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.created_at) <= new Date(daysEnd[index]));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      } else {
        filtered = exList.list.filter(list => new Date(list.date) >= new Date(daysStart[index]) && new Date(list.date) <= new Date(daysEnd[index]));
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.date) <= new Date(daysEnd[index]));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      }
      let count = 0;
      let cumulativeUnique = 0;
      let uniques = 0;
      let cCount = 0;
      let uniqueActor = [];
      const actorList = [];
      if (filtered.length) {
        filtered.forEach(val => {
          if (opts.metric === 'fork') count += val.count;
          if (opts.metric === 'clone' || opts.metric === 'view') cCount += val.count;
          if (opts.metric === 'event') actorList.push(val.actor);
          cumulative.push(val.cumulative);
          if (val.uniques) uniques += val.uniques;
          if (val.cumulativeUnique) cumulativeUnique += val.cumulativeUnique;
        });
        if (opts.metric === 'event') uniqueActor = actorList.filter((val, ind) => actorList.indexOf(val) === ind);
        if (opts.metric === 'fork') {
          count += filtered.length;
        } else {
          count = filtered.length;
        }
        if (opts.metric === 'clone' || opts.metric === 'view') count = cCount;
        if (opts.metric === 'commit') {
          [count, uniques, cumulative] = ConvertCommitsToView(filtered, opts);
        }
      }
      let cumulativeValue = 0;
      if (cumulative.length) {
        cumulativeValue = Math.max(...cumulative);
      }
      if (opts.metric === 'release' || opts.metric === 'watch') count = cumulativeValue;
      const Obj = Object.assign({
        date: daysStart[index],
        count,
        cumulative: cumulativeValue
      });
      if (opts.type === 'org' || opts.type === 'author') Obj.uniques = uniques;
      if (opts.metric === 'clone') Obj.uniques = uniques;
      if (opts.metric === 'event') Obj.uniques = uniqueActor.length;
      if (opts.metric === 'view') {
        Obj.cumulativeUnique = cumulativeUnique;
        Obj.uniques = uniques;
      }
      daywise.list.push(Obj);
    }
    daysView.push(daywise);
  });
  daysView.map(days => {
    for (let i = 1; i < days.list.length; i += 1) {
      if (days.list[i].cumulative === 0) {
        days.list[i].cumulative = days.list[i - 1].cumulative;
      }
    }
    return true;
  });
  return daysView;
};

const GetWeeksList = async opts => {
  const dateFrom = opts.from ? opts.from : opts.since;
  const dateTo = opts.upto ? opts.upto : opts.until;
  const startDate = new Date(dateFrom);
  const weekStart = [];
  const weekEnd = [];
  for (const ends = new Date(dateTo); ends >= startDate; ends.setDate(ends.getDate() - ends.getDay() - 1)) {
    const eDate = new Date(ends);
    weekEnd.push(eDate.toISOString());
    eDate.setSeconds(eDate.getSeconds() + 1);
    weekStart.push(eDate.toISOString());
  }
  weekStart.shift();
  weekStart.push(startDate.toISOString());
  return [weekStart, weekEnd];
};

const GetWeeksView = async (expandViews, opts) => {
  const [start, end] = await GetWeeksList(opts);
  const weekStart = start.sort((a, b) => new Date(a) - new Date(b));
  const weekEnd = end.sort((a, b) => new Date(a) - new Date(b));
  const weekView = [];
  expandViews.forEach(async exList => {
    const weekwise = {
      repo: exList.repo,
      list: []
    };
    if (exList.list.length) {
      if (opts.metric === 'star') {
        weekwise.date = exList.list[0].starred_at;
      } else if (opts.metric === 'pull') {
        weekwise.date = exList.list[0].created_at;
      } else {
        weekwise.date = exList.list[0].date;
      }
    }
    for (let index = 0; index < weekStart.length; index += 1) {
      let filtered = [];
      let cumulative = [];
      if (opts.metric === 'star') {
        filtered = exList.list.filter(list => new Date(list.starred_at) >= new Date(weekStart[index]) && new Date(list.starred_at) <= new Date(weekEnd[index]));
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.starred_at) <= new Date(weekEnd[index]));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      } else if (opts.metric === 'pull') {
        filtered = exList.list.filter(list => new Date(list.created_at) >= new Date(weekStart[index]) && new Date(list.created_at) <= new Date(weekEnd[index]));
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.created_at) <= new Date(weekEnd[index]));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      } else {
        filtered = exList.list.filter(list => new Date(list.date) >= new Date(weekStart[index]) && new Date(list.date) <= new Date(weekEnd[index]));
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.date) <= new Date(weekEnd[index]));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      }
      let count = 0;
      const cumUnique = [];
      let uniques = 0;
      let cCount = 0;
      let uniqueActor = [];
      const actorList = [];
      if (filtered.length) {
        filtered.forEach(val => {
          if (opts.metric === 'fork') count += val.count;
          if (opts.metric === 'clone' || opts.metric === 'view') cCount += val.count;
          if (opts.metric === 'event') actorList.push(val.actor);
          cumulative.push(val.cumulative);
          if (val.uniques) uniques += val.uniques;
          if (val.cumulativeUnique) cumUnique.push(val.cumulativeUnique);
        });
        if (opts.metric === 'event') uniqueActor = actorList.filter((val, ind) => actorList.indexOf(val) === ind);
        if (opts.metric === 'fork') {
          count += filtered.length;
        } else {
          count = filtered.length;
        }
        if (opts.metric === 'clone' || opts.metric === 'view') count = cCount;
        if (opts.metric === 'commit') {
          [count, uniques, cumulative] = ConvertCommitsToView(filtered, opts);
        }
      }
      let cumulativeValue = 0;
      if (cumulative.length) {
        cumulativeValue = Math.max(...cumulative);
      }
      let cumulativeUnique = 0;
      if (cumUnique.length) {
        cumulativeUnique = Math.max(...cumUnique);
      }
      if (opts.metric === 'release' || opts.metric === 'watch') count = cumulativeValue;
      const Obj = Object.assign({
        startDate: weekStart[index],
        endDate: weekEnd[index],
        count,
        cumulative: cumulativeValue
      });
      if (opts.type === 'org' || opts.type === 'author') Obj.uniques = uniques;
      if (opts.metric === 'clone') Obj.uniques = uniques;
      if (opts.metric === 'event') Obj.uniques = uniqueActor.length;
      if (opts.metric === 'view') {
        Obj.cumulativeUnique = cumulativeUnique;
        Obj.uniques = uniques;
      }
      weekwise.list.push(Obj);
    }
    weekView.push(weekwise);
  });
  weekView.map(weeks => {
    for (let i = 1; i < weeks.list.length; i += 1) {
      if (weeks.list[i].cumulative === 0) {
        weeks.list[i].cumulative = weeks.list[i - 1].cumulative;
      }
    }
    return true;
  });
  return weekView;
};

const GetMonthsList = async opts => {
  const [daysStart, daysEnd] = await GetDaysList(opts);
  const dateFrom = opts.from ? opts.from : opts.since;
  const startDate = new Date(dateFrom);
  let monthCount = [];
  daysStart.forEach(day => {
    monthCount.push(`${new Date(day).getMonth()}-${new Date(day).getFullYear()}`);
  });
  monthCount = [...new Set(monthCount)];
  const monthRange = [];
  let monthStart = [];
  const monthEnd = [];
  for (let i = 0; i < monthCount.length; i += 1) {
    const split = monthCount[i].split('-');
    const endFiltered = daysEnd.filter(day => new Date(day).getMonth() === Number(split[0]) && new Date(day).getFullYear() === Number(split[1]));
    let ends = '';
    if (endFiltered.length > 0) {
      if (endFiltered.length > 1) {
        ends = endFiltered.pop();
      } else {
        ends = endFiltered;
      }
      monthEnd.push(ends);
      const starts = new Date(ends);
      starts.setSeconds(starts.getSeconds() + 1);
      monthStart.push(starts.toISOString());
    }
  }
  monthStart.pop();
  monthStart = monthStart.sort((a, b) => new Date(a) - new Date(b));
  monthStart.unshift(startDate.toISOString());
  for (let i = 0; i < monthStart.length; i += 1) {
    const Obj = Object.assign({
      startDate: monthStart[i],
      endDate: monthEnd[i]
    });
    monthRange.push(Obj);
  }
  return monthRange;
};

const GetMonthsView = async (expandViews, opts) => {
  const monthRange = await GetMonthsList(opts);
  const monthView = [];
  expandViews.forEach(async exList => {
    const monthwise = {
      repo: exList.repo,
      list: []
    };
    if (exList.list.length) {
      if (opts.metric === 'star') {
        monthwise.date = exList.list[0].starred_at;
      } else if (opts.metric === 'pull') {
        monthwise.date = exList.list[0].created_at;
      } else {
        monthwise.date = exList.list[0].date;
      }
    }
    for (let index = 0; index < monthRange.length; index += 1) {
      let filtered = [];
      let cumulative = [];
      if (opts.metric === 'star') {
        filtered = exList.list.filter(
          list => new Date(list.starred_at) >= new Date(monthRange[index].startDate) && new Date(list.starred_at) <= new Date(monthRange[index].endDate)
        );
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.starred_at) <= new Date(monthRange[index].endDate));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      } else if (opts.metric === 'pull') {
        filtered = exList.list.filter(
          list => new Date(list.created_at) >= new Date(monthRange[index].startDate) && new Date(list.created_at) <= new Date(monthRange[index].endDate)
        );
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.created_at) <= new Date(monthRange[index].endDate));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      } else {
        filtered = exList.list.filter(
          list => new Date(list.date) >= new Date(monthRange[index].startDate) && new Date(list.date) <= new Date(monthRange[index].endDate)
        );
        if (filtered.length < 1) {
          const filteredExt = exList.list.filter(list => new Date(list.date) <= new Date(monthRange[index].endDate));
          filteredExt.forEach(val => {
            cumulative.push(val.cumulative);
          });
        }
      }
      let count = 0;
      let uniques = 0;
      let cCount = 0;
      const cumulativeUniq = [];
      let uniqueActor = [];
      const actorList = [];
      if (filtered.length) {
        filtered.forEach(val => {
          if (opts.metric === 'fork') count += val.count;
          if (opts.metric === 'clone' || opts.metric === 'view') cCount += val.count;
          if (opts.metric === 'event') actorList.push(val.actor);
          cumulative.push(val.cumulative);
          if (val.uniques) uniques += val.uniques;
          if (val.cumulativeUnique) cumulativeUniq.push(val.cumulativeUnique);
        });
        if (opts.metric === 'event') uniqueActor = actorList.filter((val, ind) => actorList.indexOf(val) === ind);
        if (opts.metric === 'fork') {
          count += filtered.length;
        } else {
          count = filtered.length;
        }
        if (opts.metric === 'clone' || opts.metric === 'view') count = cCount;
        if (opts.metric === 'commit') {
          [count, uniques, cumulative] = ConvertCommitsToView(filtered, opts);
        }
      }
      let cumulativeValue = 0;
      if (cumulative.length) {
        cumulativeValue = Math.max(...cumulative);
      }
      let cumulativeUnique = 0;
      if (cumulativeUniq.length) {
        cumulativeUnique = Math.max(...cumulativeUniq);
      }
      if (opts.metric === 'release' || opts.metric === 'watch') count = cumulativeValue;
      const Obj = Object.assign({
        startDate: monthRange[index].startDate,
        endDate: monthRange[index].endDate,
        count,
        cumulative: cumulativeValue
      });
      if (opts.type === 'org' || opts.type === 'author') Obj.uniques = uniques;
      if (opts.metric === 'clone') Obj.uniques = uniques;
      if (opts.metric === 'event') Obj.uniques = uniqueActor.length;
      if (opts.metric === 'view') {
        Obj.cumulativeUnique = cumulativeUnique;
        Obj.uniques = uniques;
      }
      monthwise.list.push(Obj);
    }
    monthView.push(monthwise);
  });
  monthView.map(months => {
    for (let i = 1; i < months.list.length; i += 1) {
      if (months.list[i].cumulative === 0) {
        months.list[i].cumulative = months.list[i - 1].cumulative;
      }
    }
    return true;
  });
  return monthView;
};

const GetTableView = async (expandViews, opts) => {
  const tableView = [];
  expandViews.forEach(async exList => {
    const startDate = opts.from ? opts.from : opts.since;
    const endDate = opts.upto ? opts.upto : opts.until;
    let filtered = [];
    if (opts.metric === 'star') {
      filtered = exList.list.filter(list => new Date(list.starred_at) >= new Date(startDate) && new Date(list.starred_at) <= new Date(endDate));
    } else if (opts.metric === 'pull') {
      filtered = exList.list.filter(list => new Date(list.created_at) >= new Date(startDate) && new Date(list.created_at) <= new Date(endDate));
    } else {
      filtered = exList.list.filter(list => new Date(list.date) >= new Date(startDate) && new Date(list.date) <= new Date(endDate));
    }
    let count = 0;
    let uniques = 0;
    let cCount = 0;
    let cumulative = [];
    let internal = 0;
    let external = 0;
    let open = 0;
    let close = 0;
    let merge = 0;
    const actorList = [];
    if (filtered.length) {
      filtered.forEach(val => {
        if (opts.metric === 'fork') count += val.count;
        if (opts.metric === 'clone' || opts.metric === 'view') cCount += val.count;
        if (opts.metric === 'event') actorList.push(val.actor);
        cumulative.push(val.cumulative);
        if (val.uniques) uniques += val.uniques;
      });
      if (opts.metric === 'fork') {
        count += filtered.length;
      } else {
        count = filtered.length;
      }
      if (opts.metric === 'clone' || opts.metric === 'view') count = cCount;
      if (opts.metric === 'commit') {
        [count, uniques, cumulative] = ConvertCommitsToView(filtered, opts);
      }
      if (opts.metric === 'issue') {
        open = filtered.filter(issue => issue.state === 'open').length;
        close = filtered.length - open;
      }
      if (opts.metric === 'pull') {
        open = filtered.filter(pr => pr.state === 'open').length;
        merge = filtered.filter(pr => pr.merged_at !== null).length;
        close = filtered.length - open;
      }
    }
    let cumulativeValue = 0;
    if (cumulative.length) {
      cumulativeValue = Math.max(...cumulative);
    }
    if (opts.metric === 'release' || opts.metric === 'watch') count = cumulativeValue;
    if (opts.type === 'author') {
      if (opts.table) {
        internal = count.internal ? count.internal.length : 0;
        external = count.external ? count.external.length : 0;
      }
      count = uniques;
    }
    const Obj = Object.assign({
      count,
      repo: exList.repo
    });
    if (opts.metric === 'view') Obj.uniques = uniques;
    if (opts.type === 'author' && opts.table) {
      Obj.internal = internal;
      Obj.external = external;
    }
    if (opts.metric === 'issue' || opts.metric === 'pull') {
      Obj.open = open;
      Obj.close = close;
    }
    if (opts.metric === 'pull') Obj.merge = merge;
    tableView.push(Obj);
  });
  return tableView;
};

module.exports = {
  GetDaysView,
  GetWeeksView,
  GetMonthsView,
  GetTableView
};
