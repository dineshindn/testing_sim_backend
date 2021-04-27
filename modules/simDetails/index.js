const executeQuery = require("../../database");
var async = require('async');
var _ = require('lodash');


const {
  formSetClause
} = require('../../utils')

let finalData = [];
const getReport = async (rowData, next) => {
  try {
    const oemName = await executeQuery(`SELECT name FROM oem WHERE id=?;`, [rowData.fk_oem]);
    const providerName = await executeQuery(`SELECT name FROM networkProvider WHERE id=?;`, [rowData.fk_networkProviderId]);
    const statusName = await executeQuery(`SELECT name FROM status WHERE id=?;`, [rowData.fk_status]);
    if (oemName && oemName[0].name) rowData['Customer'] = oemName[0].name;
    if (providerName && providerName[0].name) rowData['Network Provider'] = providerName[0].name;
    if (statusName && statusName[0].name) rowData['Status'] = statusName[0].name;
    rowData['Created at'] = rowData.insertUTC;
    rowData['Last updated'] = rowData.updateUTC;
    delete rowData.fk_status;
    delete rowData.fk_oem;
    delete rowData.fk_networkProviderId;
    delete rowData.insertUTC;
    delete rowData.id;

    finalData.push(rowData);
    next();
  } catch (_err) {
    console.log(":::Generate excel error:::::=>", _err)
    next();
  }

}
module.exports = {

  async create(req, res) {
    try {
      const result = await executeQuery(
        "INSERT INTO simDetails (deviceId, simNumber, deviceSerialNumber, imeiNumber, fk_networkProviderId, fk_oem, vinMsnNumber, registrationNumber, subscriptionStatus, subscriptionEndDate, mobileNumber, fk_status, stateChangeDate, dispatchDate, insertUTC, isRequested, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          req.body.deviceId,
          req.body.simNumber,
          req.body.deviceSerialNumber,
          req.body.imeiNumber,
          req.body.fk_networkProviderId,
          req.body.fk_oem,
          req.body.vinMsnNumber,
          req.body.registrationNumber,
          req.body.subscriptionStatus,
          req.body.subscriptionEndDate,
          req.body.mobileNumber,
          req.body.fk_status,
          req.body.stateChangeDate,
          req.body.dispatchDate,
          new Date(),
          0,
          new Date()
        ]
      );
      const sim = (await executeQuery("SELECT deviceId from simDetails WHERE id=?", [result.insertId]))[0];
      return res.status(200).send({ status: 200, message: 'success', reason: 'Created Successfully', result: { id: result.insertId, deviceId: sim.deviceId } });
    } catch (err) {
      //return res.send({ status: 400, message: 'failure', result: { error: err.message } });
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });

    }
  },

  async update(req, res) {
    const whiteListedColumns = [
      "deviceId",
      "simNumber",
      "deviceSerialNumber",
      "imeiNumber",
      "fk_networkProviderId",
      "fk_oem",
      "vinMsnNumber",
      "registrationNumber",
      "subscriptionStatus",
      "subscriptionEndDate",
      "mobileNumber",
      "fk_status",
      "stateChangeDate",
      "dispatchDate",
    ];
    try {
      let { setClause, values } = await formSetClause(req.body, whiteListedColumns);
      setClause += ', updateUTC=?';
      const sim = (await executeQuery("SELECT * from simDetails WHERE id=?", [req.query.id]));
      if (sim && sim.length === 0) return res.status(404).send({ error: "Record not found" });

      let updateQuery = `UPDATE simDetails` + setClause + " WHERE id=?";
      values.push(new Date());
      values.push(sim[0].id);
      const result = await executeQuery(updateQuery, values);
      return res.status(200).send({ status: 200, message: 'success', reason: 'updated successfully', result: { id: sim[0].id, deviceId: sim[0].deviceId } });
    } catch (err) {
      console.log(err);
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', result: { error: err.message } });
    }
  },

  async list(req, res) {
    try {
      const { simNumber, deviceId, deviceIdSort, mobileNumber, networkProviderId, imeiNumber, networkProvider, oem, stateChangeDate, stateChangeDateSort, dispatchDate, status, dispatchDateSort, from, to, isDownload } = req && req.query ? req.query : {};
      const limit = req && req.query && req.query.limit ? req.query.limit : 10;
      const page = req && req.query && req.query.page ? req.query.page : 1;
      const sort = req && req.query && req.query.page ? req.query.sort : '';
      var offset;
      offset = (page - 1) * limit;
      offset = Number.isNaN(offset) ? 0 : offset;
      let value;
      let query;
      if (simNumber || deviceId || mobileNumber || networkProviderId || imeiNumber || networkProvider || oem || stateChangeDate || stateChangeDateSort || dispatchDate || status || deviceIdSort || dispatchDateSort || from || to) {
        if (simNumber) {
          query = `SELECT * FROM simDetails WHERE simNumber REGEXP ${simNumber} limit ${limit} offset ${offset};`;
          value = simNumber;
        } else if (deviceId || deviceIdSort) {
          query = deviceIdSort ? `SELECT * FROM simDetails ORDER BY deviceId ${deviceIdSort};` : `SELECT * FROM simDetails WHERE deviceId REGEXP '${deviceId}' limit ${limit} offset ${offset};`;
          value = deviceId;
        } else if (mobileNumber) {
          query = `SELECT * FROM simDetails WHERE mobileNumber REGEXP ${mobileNumber} limit ${limit} offset ${offset};`;
          value = mobileNumber;
        } else if (networkProviderId) {
          query = `SELECT * FROM simDetails WHERE networkProviderId REGEXP ${networkProviderId} limit ${limit} offset ${offset};`;
          value = networkProviderId;
        } else if (networkProvider) {
          const networkId = (await executeQuery(`SELECT id FROM networkProvider WHERE name REGEXP '${networkProvider}';`))[0]
          let _id = networkId && networkId.id ? networkId.id : ''
          query = `SELECT * FROM simDetails WHERE fk_networkProviderId=? limit ${limit} offset ${offset};`;
          value = _id;
        } else if (oem) {
          const oemId = (await executeQuery(`SELECT id FROM oem WHERE name REGEXP '${oem}';`))[0]
          let _id = oemId && oemId.id ? oemId.id : ''
          query = `SELECT * FROM simDetails WHERE fk_oem=? limit ${limit} offset ${offset};`;
          value = _id;
        } else if (imeiNumber) {
          query = `SELECT * FROM simDetails WHERE imeiNumber REGEXP ${imeiNumber} limit ${limit} offset ${offset};`;
          value = imeiNumber;
        }
        // else if (status) {
        //   if (status === 'ALL') {
        //     query = `SELECT * FROM simDetails limit ${limit} offset ${offset};`
        //   } else {
        //     const statusId = (await executeQuery(`SELECT id FROM status WHERE name REGEXP '${status}';`))[0]
        //     let _id = statusId && statusId.id ? statusId.id : ''
        //     query = `SELECT * FROM simDetails WHERE fk_status=? limit ${limit} offset ${offset};`;
        //     value = _id;
        //   }
        // }
        else if (stateChangeDate || stateChangeDateSort) {
          query = stateChangeDateSort ? `SELECT * FROM simDetails ORDER BY stateChangeDate ${stateChangeDateSort};` : `SELECT * FROM simDetails WHERE stateChangeDate=?`;
          value = stateChangeDate;
        } else if (dispatchDate || dispatchDateSort) {
          query = dispatchDateSort ? `SELECT * FROM simDetails ORDER BY dispatchDate ${dispatchDateSort};` : `SELECT * FROM simDetails WHERE dispatchDate=?`;
          value = dispatchDate;
        } else if (status || from && to) {
          if (status === 'ALL') {
            query = status === 'ALL' && !from && !to ? `SELECT * FROM simDetails limit ${limit} offset ${offset};` : `SELECT * FROM simDetails WHERE insertUTC >= '${from}' AND insertUTC <= '${to}' limit ${limit} offset ${offset};`
          } else {
            const statusId = (await executeQuery(`SELECT id FROM status WHERE name REGEXP '${status}';`))[0]
            let _id = statusId && statusId.id ? statusId.id : ''
            query = !from && !to ? `SELECT * FROM simDetails WHERE fk_status=? limit ${limit} offset ${offset};` : `SELECT * FROM simDetails WHERE fk_status=? AND insertUTC >= '${from}' AND insertUTC <= '${to}' limit ${limit} offset ${offset};`
            value = _id;
          }
          // console.log("====inside the from and to====")
          // query = `SELECT * FROM simDetails WHERE insertUTC >= '${from}' AND insertUTC <= '${to}' limit ${limit} offset ${offset};`
        }
      } else {
        query = `SELECT * FROM simDetails limit ${limit} offset ${offset};`;
      }
      const result = await executeQuery(query, [value]);
      if (isDownload && isDownload === 'true') {
        if (result && result.length) {
          let series = [];
          result.forEach((element) => {
            series.push(next => {
              getReport(element, next);
            });
          })
          async.series(series, async function (err) {
            try {
              if (err) {
                return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong while downloading the data", result: { error: err.message } });
              }
              return res.xls('data.xlsx', finalData)
            } catch (error) {
              return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
            } finally {
              finalData = [];
            }

          });
        }
      } else {
        const totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails;`);
        const responseJson = {
          'totalCount': parseInt(Object.values(totalRecords[0]).join(",")),
          'pageCount': result.length,
          'pageNumber': page,
          'data': result
        }
        return res.status(200).send({ status: 200, message: 'success', result: responseJson });
      }
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
  },


  async getSimDetailsById(req, res) {
    try {
      let _id = req && req.query && req.query.id ? req.query.id : '';
      let value;
      let query;
      if (_id) {
        query = `SELECT * FROM simDetails WHERE id=?;`;
        value = _id;
      } else {
        return res.send({ status: 400, message: 'failure', reason: 'Invalid query', result: { error: err.message } });
      }
      const result = await executeQuery(query, [value]);
      return res.status(200).send({ status: 200, message: 'success', result: result });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
  },

  async delete(req, res) {
    try {
      let recordId = req && req.query && req.query.id ? req.query.id : '';
      await executeQuery("DELETE FROM `simDetails` WHERE id=?", [recordId]);
      return res.status(200).send({ status: 200, message: 'success', reason: 'Deleted successfully', result: { id: recordId } });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
  },

  async simStateChange(req, res) {
    try {
      const { simId, statusId } = req.body ? req.body : {};
      if (simId && statusId) {
        const recordExists = (await executeQuery("SELECT * from status WHERE id=?", [statusId]))[0];
        if (!recordExists) {
          return res.status(400).send({ status: 400, message: 'failure', reason: "Status Id error" });
        }
        await executeQuery(
          "UPDATE simDetails SET fk_status=?, updateUTC=? WHERE id=?;",
          [
            statusId,
            new Date(),
            simId
          ]
        );
        return res.status(200).send({ status: 200, message: 'Success', reason: 'state changed' });
      } else {
        return res.status(400).send({ status: 400, message: 'failure', reason: "Invalid post data" });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
  }
};
