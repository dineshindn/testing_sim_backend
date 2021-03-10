const executeQuery = require("../database");
var async = require('async');


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
        async.series(series, function (err) {
          if (err) {
            return res.send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
          }
          return res.send({ status: 200, message: 'success', result: finalData });
        });
      } else {
        return res.send({ status: 400, message: 'failure', reason: "No record found" });

      }
    } catch (err) {
      return res.send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
    async function getReport(id, statusName, next) {
      try {
        let obj = {};
        const resp = await executeQuery(`SELECT COUNT(*) AS stateCount FROM simDetails WHERE fk_subscriptionStatus=?;`, [id]);
        obj['state'] = statusName;
        obj['count'] = resp[0].stateCount;
        finalData.push(obj);
        next();
      } catch (_err) {
        next();
        return res.send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: _err.message } });
      }

    }
  }
};
