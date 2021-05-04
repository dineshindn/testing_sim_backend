const executeQuery = require("../../database");
var async = require('async');
var _ = require('lodash');


module.exports = {

  async getSimStateCount(req, res) {
    let finalData = [];
    try {
      const data = await executeQuery("SELECT * FROM `status`;");
      if (data && data.length) {
        let series = [];
        data.forEach(function (element) {
          series.push(next => {
            getReport(element.id, element.name, next);
          });
        })
        async.series(series, async function (err) {
          if (err) {
            return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
          }
          const resp = await executeQuery(`SELECT COUNT(*) AS totalSimCards FROM simDetails;`);
          const noDeviceCount = await executeQuery(`SELECT COUNT(*) AS withoutDevice FROM simDetails where deviceId=?;`,['']);
          const deviceCount = await executeQuery(`SELECT COUNT(*) AS withDevice FROM simDetails where ORD(deviceId) > 0;`);
          return res.status(200).send({ status: 200, message: 'success', totalSimCards: resp[0].totalSimCards, withoutDeviceId: noDeviceCount[0].withoutDevice, withDeviceId: deviceCount[0].withDevice  ,result: finalData });
        });
      } else {
        return res.status(400).send({ status: 400, message: 'failure', reason: "No record found" });

      }
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
    async function getReport(id, statusName, next) {
      try {
        let obj = {};
        const resp = await executeQuery(`SELECT COUNT(*) AS stateCount FROM simDetails WHERE fk_status=?;`, [id]);
        obj['state'] = statusName;
        obj['count'] = resp[0].stateCount;
        finalData.push(obj);
        next();
      } catch (_err) {
        next();
        return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: _err.message } });
      }

    }
  },

  async getProviderCount(req, res) {
    let finalData = [];
    try {
      const data = await executeQuery("SELECT * FROM `networkProvider`;");
      if (data && data.length) {
        let series = [];
        data.forEach(function (element) {
          series.push(next => {
            getProviderReport(element.id, element.name, next);
          });
        })
        async.series(series, function (err) {
          if (err) {
            return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
          }
          return res.status(200).send({ status: 200, message: 'success', result: finalData });
        });
      } else {
        return res.status(400).send({ status: 400, message: 'failure', reason: "No record found" });

      }
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
    async function getProviderReport(id, providerName, next) {
      try {
        let obj = {
          active: 0,
          suspended: 0,
          deactivated: 0
        };
        let active = 0;
        let deactive = 0;
        let suspend = 0;
        const resp = await executeQuery(`SELECT COUNT(*) AS providerCount FROM simDetails WHERE fk_networkProviderId=?;`, [id]);
        const data = await executeQuery(`SELECT * FROM simDetails WHERE fk_networkProviderId=?;`, [id]);
        obj['networkProvider'] = providerName;
        obj['count'] = resp[0].providerCount;
        _.findIndex(data, function (o) {
          if (o.fk_status === 1) {
            obj['active'] = ++active;
          } else if (o.fk_status === 2) {
            obj['suspended'] = ++suspend;
          } else if (o.fk_status === 3) {
            obj['deactivated'] = ++deactive;
          }
        });
        finalData.push(obj);
        next();
      } catch (_err) {
        next();
        return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: _err.message } });
      }

    }
  },

  async getOemCount(req, res) {
    let finalData = [];
    try {
      const data = await executeQuery("SELECT * FROM `oem`;");
      if (data && data.length) {
        let series = [];
        data.forEach(function (element) {
          series.push(next => {
            getOemReport(element.id, element.name, next);
          });
        })
        async.series(series, function (err) {
          if (err) {
            return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
          }
          return res.status(200).send({ status: 200, message: 'success', result: finalData });
        });
      } else {
        return res.status(400).send({ status: 400, message: 'failure', reason: "No record found" });

      }
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
    async function getOemReport(id, oemName, next) {
      try {
        let obj = {};
        const resp = await executeQuery(`SELECT COUNT(*) AS oemCount FROM simDetails WHERE fk_oem=?;`, [id]);
        obj['oem'] = oemName;
        obj['count'] = resp[0].oemCount;
        finalData.push(obj);
        next();
      } catch (_err) {
        next();
        return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: _err.message } });
      }

    }
  }
};
