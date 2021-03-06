const executeQuery = require("../../database");
var async = require('async');
var _ = require('lodash');
const fetch = require('node-fetch');
const STATE_CHANGE_API = process.env.STATE_CHANGE_API;
const authTokenUrl = process.env.AUTH_TOKEN_URL;
const basicToken = process.env.BASIC_TOKEN;


const {
  formSetClause,
  simTransactionsFormSetClause
} = require('../../utils');

let finalData = [];
const getReport = async (rowData, next) => {
  try {
    const oemName = await executeQuery(`SELECT name FROM oem WHERE id=?;`, [rowData.fk_oem]);
    const providerName = await executeQuery(`SELECT name FROM networkProvider WHERE id=?;`, [rowData.fk_networkProviderId]);
    const statusName = await executeQuery(`SELECT name FROM status WHERE id=?;`, [rowData.fk_status]);

    rowData['Customer'] = oemName && oemName.length && oemName[0] && oemName[0].name ? oemName[0].name : '';
    rowData['Network Provider'] = providerName && providerName.length && providerName[0] && providerName[0].name ? providerName[0].name : '';
    rowData['Status'] = statusName && statusName.length && statusName[0] && statusName[0].name ? statusName[0].name : '';
    rowData['Created at'] = rowData.insertUTC;
    rowData['Last updated'] = rowData.updateUTC;
    delete rowData.fk_status;
    delete rowData.fk_oem;
    delete rowData.fk_networkProviderId;
    delete rowData.insertUTC;
    delete rowData.updateUTC;
    delete rowData.id;
    delete rowData.isRequested;
    delete rowData.stateChangeDate;
    delete rowData.dispatchDate;
    finalData.push(rowData);
    next();
  } catch (_err) {
    console.log(":::Generate excel error:::::=>", _err)
    next();
  }
}

const updateMultiStates = async (id, statusId, tokenDetailsData) => {
  try {

    const simExists = ( await executeQuery("SELECT deviceId from simDetails WHERE id=?", [id]))[0];
    if (simExists && simExists.deviceId) {
       if (tokenDetailsData && tokenDetailsData.access_token) {
        let device = [];
        device.push(simExists.deviceId)
        const responseData =  await fetch(STATE_CHANGE_API, {
          method: 'Post',
          body: { DeviceId: device },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + tokenDetailsData.access_token
          }
        });
        const resData =  await responseData.json();
        if (resData && resData.status === 'success') {
          await executeQuery(
            "UPDATE simDetails SET fk_status=?, updateUTC=? WHERE id=?;",
            [
              statusId,
              new Date(),
              id
            ]
          );
          // updating to simTransactionHistoryTable
          await updateSimTransactionHistory(id);
        } else {
        }
       } else throw 'Authentication Failure: Unable to authenticate to device Id api.';

    } else {
    }
  } catch (_err) {
    console.log("Error occured while updating the sim state", _err)
  }
}

const rolesRestrictions = async (role, result) => {
  return new Promise((resolve, reject) => {
    result.forEach((e) => {
      switch (role) {
        // case 'warehouse':
        //   delete e.fk_networkProviderId;
        //   break;
        case 'fos':
          //deviceId: 'NI00051',
          //delete e.simNumber,
          delete e.deviceSerialNumber,
            delete e.imeiNumber,
            //fk_networkProviderId,
            delete e.fk_oem,
            //vinMsnNumber,
            delete e.registrationNumber,
            delete e.subscriptionStatus,
            delete e.subscriptionEndDate,
            //e.mobileNumber,
            delete e.fk_status,
            delete e.stateChangeDate,
            delete e.dispatchDate,
            delete e.insertUTC,
            delete e.updateUTC,
            delete e.isRequested
          break;
        case 'customer':
          delete e.fk_networkProviderId;
          //deviceId: 'NI00051',
          delete e.simNumber,
            delete e.deviceSerialNumber,
            delete e.imeiNumber,
            delete fk_networkProviderId,
            delete e.fk_oem,
            // e.vinMsnNumber,
            delete e.registrationNumber,
            delete e.subscriptionStatus,
            delete e.subscriptionEndDate,
            delete e.mobileNumber,
            //fk_status: 2,
            delete e.stateChangeDate,
            delete e.dispatchDate,
            delete e.insertUTC,
            delete e.updateUTC,
            delete e.isRequested
          break;
        default:
          break;
      }
    });
  });
}

const rolesRestrictionsForDownload = async (role, result) => {
  return new Promise((resolve, reject) => {
    result.forEach((e) => {
      switch (role) {
        case 'warehouse':
          delete e['Network Provider'];
          break;
        case 'fos':
          //deviceId: 'NI00051',
          //delete e.simNumber,
          delete e.deviceSerialNumber,
            delete e.imeiNumber,
            //fk_networkProviderId,
            delete e.Customer,
            //vinMsnNumber,
            delete e.registrationNumber,
            delete e.subscriptionStatus,
            delete e.subscriptionEndDate,
            //e.mobileNumber,
            delete e.Status,
            delete e.stateChangeDate,
            delete e.dispatchDate,
            delete e['Created at'],
            delete e['Last updated'],
            delete e.isRequested
          break;
        case 'customer':
          delete e['Network Provider'];
          //deviceId: 'NI00051',
          delete e.simNumber,
            delete e.deviceSerialNumber,
            delete e.imeiNumber,
            delete fk_networkProviderId,
            delete e.Customer,
            // e.vinMsnNumber,
            delete e.registrationNumber,
            delete e.subscriptionStatus,
            delete e.subscriptionEndDate,
            delete e.mobileNumber,
            //fk_status: 2,
            delete e.stateChangeDate,
            delete e.dispatchDate,
            delete e['Created at'],
            delete e['Last updated'],
            delete e.isRequested
          break;
        default:
          break;
      }
    });
  });
}

const updateSimTransactionHistory = async (simId) => {
  if (simId) {
    try {
      const simDetails = await executeQuery("SELECT * FROM `simDetails` WHERE id=?", [simId]);
      if (simDetails && simDetails.length) {
        delete simDetails[0].id;
        delete simDetails[0].updateUTC;
        delete simDetails[0].insertUTC;
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
          "isRequested"
        ];
        let { simSetClause, _values } = await simTransactionsFormSetClause(simDetails[0], whiteListedColumns);
        let updateSimTransaction = `INSERT INTO simTransactionHistory (` + simSetClause + `) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await executeQuery(updateSimTransaction, _values);
      }
      return 0;
    } catch (err) {
      throw 'Sim Transaction history failure';
    }
  } else {
    throw 'Sim Transaction history failure : No sim id found';
  }
}

async function updateSimTransaction(data) {
  try {
    await executeQuery(
      "INSERT INTO simTransactionHistory (deviceId, simNumber, deviceSerialNumber, imeiNumber, fk_networkProviderId, fk_oem, vinMsnNumber, registrationNumber, subscriptionStatus, subscriptionEndDate, mobileNumber, fk_status, stateChangeDate, dispatchDate, insertUTC, updateUTC,isRequested) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.deviceId,
        data.simNumber,
        data.deviceSerialNumber,
        data.imeiNumber,
        data.fk_networkProviderId,
        data.fk_oem,
        data.vinMsnNumber,
        data.registrationNumber,
        data.subscriptionStatus,
        data.subscriptionEndDate,
        data.mobileNumber,
        data.fk_status,
        data.stateChangeDate,
        data.dispatchDate,
        new Date(),
        new Date(),
        data.isRequested
      ]
    );
  } catch (e) {
  }
}

module.exports = {

  async create(req, res) {
    if (req.query && req.query.role) {
      try {
        const selectQue = await executeQuery("SELECT * FROM `simDetails` WHERE `simNumber`=?", req.body.simNumber);
        if (selectQue && selectQue.length !== 0) return res.status(404).send({ error: "already sim number available" });
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
        const sim = (await executeQuery("SELECT deviceId, simNumber from simDetails WHERE id=?", [result.insertId]))[0];
        return res.status(200).send({ status: 200, message: 'success', reason: 'Created Successfully', result: { id: result.insertId, deviceId: sim.deviceId , simNumber: sim.simNumber} });
      } catch (err) {
        //return res.send({ status: 400, message: 'failure', result: { error: err.message } });
        return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
      }
    } else {
      return res.status(401).send({ status: 401, message: 'failure', reason: "UnAuthorised access" });

    }
  },

  async update(req, res) {
    if (req.query && req.query.role) {
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
        "isRequested"
      ];
      try {
        let { setClause, values } = await formSetClause(req.body, whiteListedColumns);
        setClause += ', updateUTC=?';
        const sim = (await executeQuery("SELECT * from simDetails WHERE id=?", [req.query.id]));
        if (sim && sim.length === 0) return res.status(404).send({ error: "Record not found" });
        let updateQuery = `UPDATE simDetails` + setClause + " WHERE id=?";
        values.push(new Date());
        values.push(sim[0].id);
        await executeQuery(updateQuery, values);
        const updateData = (await executeQuery("SELECT * from simDetails WHERE id=?", [sim[0].id]));
        updateSimTransaction(updateData[0]);
        return res.status(200).send({ status: 200, message: 'success', reason: 'updated successfully', result: { id: sim[0].id, deviceId: sim[0].deviceId } });
      } catch (err) {
        console.log(err);
        return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', result: { error: err.message } });
      }
    } else {
      return res.status(401).send({ status: 401, message: 'failure', reason: "UnAuthorised access" });

    }
  },

  async list(req, res) {
    try {
      const { simNumber, withoutDeviceId, deviceId, deviceIdSort, mobileNumber, networkProviderId, imeiNumber, networkProvider, oem, stateChangeDate, stateChangeDateSort, dispatchDate, status, dispatchDateSort, from, to, isDownload, role, today } = req && req.query ? req.query : {};
      if (role) {
        const limit = req && req.query && req.query.limit ? req.query.limit : 10;
        const page = req && req.query && req.query.page ? req.query.page : 1;
        var offset;
        let totalRecords;
        offset = (page - 1) * limit;
        offset = Number.isNaN(offset) ? 0 : offset;
        let value;
        let query;
        if (simNumber || deviceId || mobileNumber  || withoutDeviceId || networkProviderId || imeiNumber || networkProvider || oem || stateChangeDate || stateChangeDateSort || dispatchDate || status || deviceIdSort || dispatchDateSort || from || to || today) {
          if (simNumber) {
            query = `SELECT * FROM simDetails WHERE simNumber REGEXP '${simNumber}' limit ${limit} offset ${offset};`;
            value = simNumber;
            totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE simNumber REGEXP '${simNumber}';`);
          } else if (deviceId || deviceIdSort) {
            query = deviceIdSort ? `SELECT * FROM simDetails ORDER BY deviceId ${deviceIdSort};` : `SELECT * FROM simDetails WHERE deviceId REGEXP '${deviceId}' limit ${limit} offset ${offset};`;
            value = deviceId;   
            totalRecords = deviceIdSort ? await executeQuery(`SELECT COUNT(*) FROM simDetails ORDER BY deviceId ${deviceIdSort};`): await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE deviceId REGEXP '${deviceId}';`)
          } else if (mobileNumber) {
            query = `SELECT * FROM simDetails WHERE mobileNumber REGEXP '${mobileNumber}' limit ${limit} offset ${offset};`;
            value = mobileNumber;
            totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE mobileNumber REGEXP '${mobileNumber}';`);

          } else if (networkProviderId) {
            query = `SELECT * FROM simDetails WHERE networkProviderId REGEXP '${networkProviderId}' limit ${limit} offset ${offset};`;
            value = networkProviderId;
            //pending totalcount
          } else if (networkProvider) {
            if (networkProvider === 'ALL') {
              query = `SELECT * from simDetails limit ${limit} offset ${offset};`
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails;`);

            } else {
              const providerId = (await executeQuery(`SELECT id FROM networkProvider WHERE name REGEXP '${networkProvider}';`))[0]
              let _id = providerId && providerId.id ? providerId.id : ''
              query = `SELECT * from simDetails WHERE fk_networkProviderId=? limit ${limit} offset ${offset};`;
              value = _id;
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE fk_networkProviderId=?;`,[_id]);
            }
          }  else if (oem) {
            if (oem === 'ALL') {
              query = `SELECT * from simDetails limit ${limit} offset ${offset};`
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails;`);

            } else {
              const oemId = (await executeQuery(`SELECT id FROM oem WHERE name REGEXP '${oem}';`))[0]
              let _id = oemId && oemId.id ? oemId.id : ''
              query = `SELECT * from simDetails WHERE fk_oem=? limit ${limit} offset ${offset};`;
              value = _id;
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE fk_oem=?;`,[_id]);
            }
          }
          else if (imeiNumber) {
            query = `SELECT * FROM simDetails WHERE imeiNumber REGEXP '${imeiNumber}' limit ${limit} offset ${offset};`;
            value = imeiNumber;
            totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE imeiNumber REGEXP '${imeiNumber}';`);
          } else if (stateChangeDate || stateChangeDateSort) {
            query = stateChangeDateSort ? `SELECT * FROM simDetails ORDER BY stateChangeDate ${stateChangeDateSort};` : `SELECT * FROM simDetails WHERE DATE(stateChangeDate)='${stateChangeDate}';`;
            value = stateChangeDate;
            totalRecords = stateChangeDateSort ? await executeQuery(`SELECT COUNT(*) FROM simDetails ORDER BY stateChangeDate ${stateChangeDateSort};`): await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE DATE(stateChangeDate)='${stateChangeDate}';`)
          } else if (dispatchDate || dispatchDateSort) {
            query = dispatchDateSort ? `SELECT * FROM simDetails ORDER BY dispatchDate ${dispatchDateSort};` : `SELECT * FROM simDetails WHERE DATE(dispatchDate)='${dispatchDate}';`;
            value = dispatchDate;
            totalRecords = dispatchDateSort ? await executeQuery(`SELECT COUNT(*) FROM simDetails ORDER BY dispatchDate ${dispatchDateSort};`): await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE DATE(dispatchDate)='${dispatchDate}';`);

            //status sort and date range search & sort
          } else if (status || from && to) {
            if (status === 'ALL') {
              query = status === 'ALL' && !from && !to ? `SELECT * FROM simDetails limit ${limit} offset ${offset};` : `SELECT * FROM simDetails WHERE insertUTC >= '${from}' AND insertUTC <= '${to}' limit ${limit} offset ${offset};`
              totalRecords = status === 'ALL' && !from && !to ? await executeQuery(`SELECT COUNT(*) FROM simDetails;`): await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE insertUTC >= '${from}' AND insertUTC <= '${to}';`);

            } else if (status && status != 'withDevice' && status != 'withoutDevice' && status != 'ALL') {
              const statusId = (await executeQuery(`SELECT id FROM status WHERE name REGEXP '${status}';`))[0]
              let _id = statusId && statusId.id ? statusId.id : '';
              query = !from && !to ? `SELECT * FROM simDetails WHERE fk_status=? limit ${limit} offset ${offset};` : `SELECT * FROM simDetails WHERE fk_status=? AND insertUTC >= '${from}' AND insertUTC <= '${to}' limit ${limit} offset ${offset};`
              value = _id;
              totalRecords = !from && !to ? await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE fk_status=?;`,[_id]): await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE fk_status=? AND insertUTC >= '${from}' AND insertUTC <= '${to};`);

            } else if (status === 'withDevice' && from && to) {
              query = `SELECT * FROM simDetails where ORD(deviceId) > 0 AND insertUTC >= '${from}' AND insertUTC <= '${to}' limit ${limit} offset ${offset};`
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails where ORD(deviceId) > 0 AND insertUTC >= '${from}' AND insertUTC <= '${to}';`);
            } else if (status === 'withoutDevice' && from && to) {
              query = `SELECT * FROM simDetails where deviceId=? AND insertUTC >= '${from}' AND insertUTC <= '${to}' limit ${limit} offset ${offset};`
              value = '';
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails where deviceId=? AND insertUTC >= '${from}' AND insertUTC <= '${to}'`,['']);
            } else if (status === 'withoutDevice') {
              query = `SELECT * FROM simDetails WHERE deviceId=? limit ${limit} offset ${offset};`
              value = '';
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE deviceId=?`,['']);
            } else if (status === 'withDevice') {
              query = `SELECT * FROM simDetails where ORD(deviceId) > 0 limit ${limit} offset ${offset};`
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails where ORD(deviceId) > 0;`);

            } else if (!status && from && to) {
              query = `SELECT * FROM simDetails where insertUTC >= '${from}' AND insertUTC <= '${to}' limit ${limit} offset ${offset};`
              totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails where insertUTC >= '${from}' AND insertUTC <= '${to}';`);
            }
          } else if (today && today === 'true') {
            query = `SELECT * FROM simDetails where insertUTC >=  CURDATE() limit ${limit} offset ${offset};`
            totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails WHERE insertUTC >=  CURDATE();`);
          }
        } else {
          query = `SELECT * FROM simDetails limit ${limit} offset ${offset};`;
          totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails;`);

        }
        if(!query) return res.status(400).send({ status: 400, message: 'failure', reason: "Invalid query" });
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
                rolesRestrictionsForDownload(role, finalData);
                return res.xls('data.xlsx', finalData)
              } catch (error) {
                return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
              } finally {
                finalData = [];
              }

            });
          }
        } else {
          const responseJson = {
            'totalCount': parseInt(Object.values(totalRecords[0]).join(",")),
            'pageCount': result.length,
            'pageNumber': page,
            'data': result
          }
          rolesRestrictions(role, result);
          return res.status(200).send({ status: 200, message: 'success', result: responseJson });
        }
      } else {
        return res.status(401).send({ status: 401, message: 'failure', reason: "UnAuthorised access" });

      }
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
    }
  },


  async getSimDetailsById(req, res) {
    if (req.query && req.query.role) {
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
    } else {
      return res.status(401).send({ status: 401, message: 'failure', reason: "UnAuthorised access" });

    }

  },

  async delete(req, res) {
    if (req.query && req.query.role) {
      try {
        let recordId = req && req.query && req.query.id ? req.query.id : '';
        await executeQuery("DELETE FROM `simDetails` WHERE id=?", [recordId]);
        return res.status(200).send({ status: 200, message: 'success', reason: 'Deleted successfully', result: { id: recordId } });
      } catch (err) {
        return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
      }
    } else {
      return res.status(401).send({ status: 401, message: 'failure', reason: "UnAuthorised access" });

    }

  },

  async simStateChange(req, res) {
    if (req.query && req.query.role) {
      
      try {
        const { simId, statusId } = req.body ? req.body : {};
        if (simId && statusId) {
          if(statusId==1 || statusId==2){
            if(statusId==1){
              var statusVal = 'A';
            }else if(statusId==2){
              var statusVal = 'S';
            }else{
              var statusVal = 'D';
            }
            const recordExists = (await executeQuery("SELECT * from status WHERE id=?", [statusId]))[0];
            if (!recordExists) {
              return res.status(400).send({ status: 400, message: 'failure', reason: "Status Id error" });
            }
            const simExists = (await executeQuery("SELECT deviceId from simDetails WHERE id=?", [simId]))[0];
            if (simExists && simExists.deviceId) {
              let headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + basicToken
              }
              const tokenDetails = await fetch(authTokenUrl, {
                method: 'POST',
                headers: headers
              });
              const tokenDetailsData = await tokenDetails.json();
              if (tokenDetailsData && tokenDetailsData.access_token) {
                let device = [];
                device.push(simExists.deviceId)
                let headers1= {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + tokenDetailsData.access_token
                }
                let body_val={ "DeviceId": [device] }
                  const responseData = await fetch(`https://api-stg.trimble.com/t/trimble.com/getframewireless-stg/1.0/sim?State=${statusVal}`, {
                  //const responseData = await fetch(STATE_CHANGE_API, {
                  method: 'POST',
                  //params: { "State" : statusVal },
                  body: JSON.stringify(body_val),
                  headers: headers1
                });
                // console.log(responseData);
                const resData = await responseData.json();
                if (resData && resData.status === 'success') {
                  await executeQuery(
                    "UPDATE simDetails SET fk_status=?, updateUTC=? WHERE id=?;",
                    [
                      statusId,
                      new Date(),
                      simId
                    ]
                  );
                  // updating to simTransactionHistoryTable
                  await updateSimTransactionHistory(simId);

                  return res.status(200).send({ status: 200, message: 'Success', reason: 'state changed' });
                } else {
                  return res.status(400).send({ status: 400, message: 'failure', reason: "Invalid device id" });
                }
              } else throw 'Authentication Failure: Unable to authenticate to device Id api.';

              } else {
                return res.status(400).send({ status: 400, message: 'failure', reason: "Invalid device id" });
              }
          }else{
              return res.status(400).send({ status: 400, message: 'failure', reason: "Currently not available" });
          }
        } else {
          return res.status(400).send({ status: 400, message: 'failure', reason: "Invalid post data" });
        }
      } catch (err) {
        console.log(err);
        return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
      }
    } else {
      return res.status(401).send({ status: 401, message: 'failure', reason: "UnAuthorised access" });
    }
  },

  //multiple sim state change 
  async multipleSimStateChange(req, res) {
    if (req.query && req.query.role) {

      try {
        const ids = req.body && req.body.simIds ? req.body.simIds : [];
        const { statusId } = req.body ? req.body : {};
        if (ids && ids.length && statusId) {
          const recordExists = (await executeQuery("SELECT * from status WHERE id=?", [statusId]))[0];
          if (!recordExists) {
            return res.status(400).send({ status: 400, message: 'failure', reason: "Status Id error" });
          }
          let headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + basicToken
          }
          const tokenDetails = await fetch(authTokenUrl, {
            method: 'Post',
            headers: headers
          });
          const tokenDetailsData =  await tokenDetails.json();
          let series = [];
          ids.forEach((id) => {
            series.push(async (next) => {
             await updateMultiStates(id, statusId ,tokenDetailsData);
            });
          })
          async.series(series, async function (err) {
            try {
              if (err) {
                return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
              }
              return res.status(200).send({ status: 200, message: 'Success', reason: 'state changed' });
            } catch (error) {
              return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: error.message } });
            }
          });
        } else {
          return res.status(400).send({ status: 400, message: 'failure', reason: "Invalid post data" });
        }
      } catch (err) {
        console.log(err);
        return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
      }
    } else {
      return res.status(401).send({ status: 401, message: 'failure', reason: "UnAuthorised access" });

    }
  }
}
 