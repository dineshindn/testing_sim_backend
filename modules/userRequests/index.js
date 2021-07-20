const executeQuery = require("../../database");
var async = require('async');
var _ = require('lodash');
var randomize = require('randomatic');
const fetch = require('node-fetch');
const STATE_CHANGE_API = process.env.STATE_CHANGE_API;
const authTokenUrl = process.env.AUTH_TOKEN_URL;
const basicToken = process.env.BASIC_TOKEN;

const {
  formSetClause
} = require('../../utils');

let finalData = [];
const getReport = async (rowData, next) => {
  try {
    const reqState = await executeQuery(`SELECT name FROM status WHERE id=?;`, [rowData.fk_requestedState]);
    const assignedName = await executeQuery(`SELECT userName FROM users WHERE id=?;`, [rowData.fk_assignedTo]);
    const createdName = await executeQuery(`SELECT userName FROM users WHERE id=?;`, [rowData.fk_createdBy]);
    const sim = await executeQuery(`SELECT simNumber FROM simDetails WHERE id=?;`, [rowData.fk_simId]);
    rowData['requested state'] = reqState && reqState.length && reqState[0] && reqState[0].name ? reqState[0].name : '';
    rowData['assigned to'] = assignedName && assignedName.length && assignedName[0] && assignedName[0].userName ? assignedName[0].userName : '';
    rowData['created by'] = createdName && createdName.length && createdName[0] && createdName[0].userName ? createdName[0].userName : '';
    if (sim && sim[0].simNumber) rowData['sim number'] = sim && sim.length && sim[0] && sim[0].simNumber ? sim[0].simNumber : '';
    rowData['Created at'] = rowData.insertUTC;
    rowData['Last updated'] = rowData.updateUTC;
    delete rowData.fk_requestedState;
    delete rowData.fk_assignedTo;
    delete rowData.fk_createdBy;
    delete rowData.insertUTC;
    delete rowData.updateUTC;
    delete rowData.fk_simId;
    delete rowData.id;
    finalData.push(rowData);
    next();
  } catch (_err) {
    console.log(":::Generate excel error:::::=>", _err)
    next();
  }
}

const saveRequest = async (element) => {
  try {
    if (element.fk_simId && element.fk_requestedState) {
      const simDeviceId = (await executeQuery("SELECT deviceId from simDetails WHERE id=?", [element.fk_simId]))[0];
      if (simDeviceId && simDeviceId.deviceId && simDeviceId.deviceId.length) {
        const requestNumber = randomize('A0', 8);
        const result = await executeQuery(
          "INSERT INTO userRequests (requestNumber, fk_simId, fk_requestedState, comments, fk_assignedTo, fk_createdBy, status, resolution, closedDate, raisedDate, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            requestNumber,
            element.fk_simId,
            element.fk_requestedState,
            element.comments,
            element.fk_assignedTo,
            element.fk_createdBy,
            'Pending',
            element.resolution,
            element.closedDate,
            new Date(),
            new Date(),
            new Date()
          ]
        );

        // creating notifications
        await executeQuery(
          "INSERT INTO notifications (fk_createdBy, fk_userRequestsId, fk_resolvedBy, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?)",
          [
            element.fk_createdBy,
            result.insertId,
            null,
            new Date(),
            new Date()
          ]
        );
        //updating isRequested filed in the simDetials
        await executeQuery(
          "UPDATE simDetails SET isRequested=? WHERE id=?;",
          [
            1,
            element.fk_simId
          ]
        );
      }
    }
  } catch (_err) {
    console.log(":::Generate excel error:::::=>", _err)
  }
}

module.exports = {

  async create(req, res) {
    try {
      if (req.body && req.body.fk_simId && req.body.fk_requestedState) {
        const simDeviceId = (await executeQuery("SELECT deviceId from simDetails WHERE id=?", [req.body.fk_simId]))[0];
        if (simDeviceId && simDeviceId.deviceId && simDeviceId.deviceId.length) {
          const requestNumber = randomize('A0', 8);
          const result = await executeQuery(
            "INSERT INTO userRequests (requestNumber, fk_simId, fk_requestedState, comments, fk_assignedTo, fk_createdBy, status, resolution, closedDate, raisedDate, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              requestNumber,
              req.body.fk_simId,
              req.body.fk_requestedState,
              req.body.comments,
              req.body.fk_assignedTo,
              req.body.fk_createdBy,
              'Pending',
              req.body.resolution,
              req.body.closedDate,
              new Date(),
              new Date(),
              new Date()
            ]
          );
          const request = (await executeQuery("SELECT requestNumber from userRequests WHERE id=?", [result.insertId]))[0];

          // creating notifications
          await executeQuery(
            "INSERT INTO notifications (fk_createdBy, fk_userRequestsId, fk_resolvedBy, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?)",
            [
              req.body.fk_createdBy,
              result.insertId,
              null,
              new Date(),
              new Date()
            ]
          );
          //updating isRequested filed in the simDetials
          await executeQuery(
            "UPDATE simDetails SET isRequested=? WHERE id=?;",
            [
              1,
              req.body.fk_simId
            ]
          );
          return res.status(200).send({ status: 200, message: 'success', reason: 'Created Successfully', result: { id: result.insertId, requestNumber: request.requestNumber } });
        } else {
          return res.status(400).send({ status: 400, message: 'failure', reason: 'Invalid device id' });
        }
      } else {
        return res.status(400).send({ status: 400, message: 'failure', reason: 'Invalid data' });

      }
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', result: { error: err.message } });
    }
  },

  async createMultipleUserRequest(req, res) {
    try {
      let data = req.body ? req.body : [];
      if (data && data.length) {
        let series = [];
        data.forEach((element) => {
          series.push(async (next) => {
            await saveRequest(element);
          });
        })
        async.series(series, async function (err) {
          try {
            if (err) {
              return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
            }
            return res.status(200).send({ status: 200, message: 'success', reason: 'Created Successfully' });
          } catch (error) {
            return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: error.message } });
          } 
        });
      }
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', result: { error: err.message } });
    }
  },

  async update(req, res) {
    const whiteListedColumns = [
      "requestNumber",
      "fk_simId",
      "fk_requestedState",
      "comments",
      "fk_assignedTo",
      "fk_createdBy",
      "status",
      "resolution",
      "closedDate",
      "raisedDate"
    ];
    try {
      let { setClause, values } = await formSetClause(req.body, whiteListedColumns);
      setClause += ', updateUTC=?';
      const record = (await executeQuery("SELECT * from userRequests WHERE id=?", [req.query.id]));
      if (record && record.length === 0) return res.status(404).send({ error: "Record not found" });

      let updateQuery = `UPDATE userRequests` + setClause + " WHERE id=?";
      values.push(new Date());
      values.push(record[0].id);
      const result = await executeQuery(updateQuery, values);
      return res.status(200).send({ status: 200, message: 'success', reason: 'updated successfully', result: { id: record[0].id, requestNumber: record[0].requestNumber } });
    } catch (err) {
      console.log(err);
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', result: { error: err.message } });
    }
  },

  async list(req, res) {
    try {
      const { requestNumber, comments, requestedState, requestedStateSort, commentsSort, resolution, resolutionSort, raisedDate, raisedDateSort, closedDate, closedDateSort, status, statusSort, assignedTo, createdBy, isDownload, today } = req && req.query ? req.query : {};

      const limit = req && req.query && req.query.limit ? req.query.limit : 10;
      const page = req && req.query && req.query.page ? req.query.page : 1;
      const sort = req && req.query && req.query.page ? req.query.sort : '';
      let totalRecords;
      var offset;
      offset = (page - 1) * limit;
      offset = Number.isNaN(offset) ? 0 : offset;
      let value;
      let query;
      if (requestNumber || requestedState || requestedStateSort || comments || commentsSort || resolution || resolutionSort || raisedDate || raisedDateSort || closedDate || closedDateSort || status || statusSort || assignedTo || createdBy || today) {
        if (requestNumber) {
          query = `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id WHERE requestNumber REGEXP '${requestNumber}' limit ${limit} offset ${offset};`;
          value = requestNumber;
          totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE requestNumber REGEXP '${requestNumber}';`);

        } else if (comments || commentsSort) {
          console.log("=====comments======",comments, commentsSort)
          query = commentsSort ? `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id ORDER BY comments ${commentsSort} limit ${limit} offset ${offset};` : `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id WHERE comments REGEXP '${comments}' limit ${limit} offset ${offset};`;
          value = comments;
          totalRecords = commentsSort ? await executeQuery(`SELECT COUNT(*) FROM userRequests ORDER BY comments ${commentsSort};`) : await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE comments REGEXP '${comments}';`);

        } else if (status) {
          query = status == 'ALL' ? `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id  limit ${limit} offset ${offset};` : `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id  WHERE status REGEXP '${status}' limit ${limit} offset ${offset}`;
          value = status;
          totalRecords = status == 'ALL' ? await executeQuery(`SELECT COUNT(*) FROM userRequests;`) : await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE status REGEXP '${status}';`);

        } else if (statusSort) {
          query = `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id ORDER BY status ${statusSort} limit ${limit} offset ${offset};`
          value = statusSort;
          totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests ORDER BY status ${statusSort};`);

        } else if (requestedState) {
          if (requestedState === 'ALL') {
            query = `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id limit ${limit} offset ${offset};`
            totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests;`);

          } else {
            const reqStateId = (await executeQuery(`SELECT id FROM status WHERE name REGEXP '${requestedState}';`))[0]
            let _id = reqStateId && reqStateId.id ? reqStateId.id : ''
            query = `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id WHERE fk_requestedState=? limit ${limit} offset ${offset};`;
            value = _id;
            totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE fk_requestedState=?;`,[_id]);

          }
        }
        // else if (requestedStateSort) {
        //   const reqStateId = (await executeQuery(`SELECT id FROM requestStatus WHERE name=?`, [requestedStateSort]))[0];
        //   query = `SELECT * FROM userRequests WHERE fk_requestedState REGEXP ${reqStateId.id} limit ${limit} offset ${offset};`;
        //   value = reqStateId.id;
        // } 
        else if (raisedDate || raisedDateSort) {
          query = raisedDateSort ? `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id  ORDER BY raisedDate ${raisedDateSort};` : `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id WHERE raisedDate=?`;
          value = raisedDate;
          totalRecords = raisedDateSort ? await executeQuery(`SELECT COUNT(*) FROM userRequests ORDER BY raisedDate ${raisedDateSort};`) : await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE raisedDate=?;`,[raisedDate]);

        } else if (closedDate || closedDateSort) {
          query = closedDateSort ? `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id ORDER BY closedDate ${closedDateSort};` : `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id WHERE closedDate=?`;
          value = closedDate;
          totalRecords = closedDateSort ? await executeQuery(`SELECT COUNT(*) FROM userRequests ORDER BY closedDate ${closedDateSort};`) : await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE closedDate=?;`,[closedDate]);

        } else if (resolution || resolutionSort) {
          query = resolutionSort ? `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id ORDER BY resolution ${resolutionSort} limit ${limit} offset ${offset};` : `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id WHERE resolution REGEXP '${resolution}' limit ${limit} offset ${offset};`;
          value = resolution;
          totalRecords = resolutionSort ? await executeQuery(`SELECT COUNT(*) FROM userRequests ORDER BY resolution ${resolutionSort};`) : await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE resolution REGEXP '${resolution}';`);

        } else if (assignedTo) {
          const assignedId = (await executeQuery(`SELECT id FROM users WHERE userName REGEXP '${assignedTo}';`))[0]
          let _id = assignedId && assignedId.id ? assignedId.id : ''
          query = `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id WHERE fk_assignedTo=? limit ${limit} offset ${offset};`;
          value = _id;
          totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE fk_assignedTo=?;`,[_id]);

        } else if (createdBy) {
          const createdById = (await executeQuery(`SELECT id FROM users WHERE userName REGEXP '${createdBy}';`))[0]
          let _id = createdById && createdById.id ? createdById.id : ''
          query = `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id WHERE fk_createdBy=? limit ${limit} offset ${offset};`;
          value = _id;
          totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE fk_createdBy=?;`,[_id]);

        } else if(today && today === 'true'){
          query = `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id  WHERE userRequests.insertUTC >=  CURDATE() limit ${limit} offset ${offset};`
          totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests WHERE insertUTC >=  CURDATE();`);
        }
      } else {
        query = `SELECT userRequests.*, simDetails.simNumber FROM userRequests LEFT JOIN simDetails ON userRequests.fk_simId = simDetails.id  limit ${limit} offset ${offset};`;
        totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests;`);
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
                return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: err.message } });
              }
              return res.xls('data.xlsx', finalData)
            } catch (error) {
              return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong", result: { error: error.message } });
            } finally {
              finalData = [];
            }

          });
        }
      } else {
        await result.sort((a, b) => b.insertUTC - a.insertUTC)
        const responseJson = {
          'totalCount': parseInt(Object.values(totalRecords[0]).join(",")),
          'pageCount': result.length,
          'pageNumber': page,
          'data': result
        }
        return res.status(200).send({ status: 200, message: 'success', result: responseJson });
      }
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', result: { error: err.message } });
    }
  },

  async getUserRequestById(req, res) {
    try {
      let _id = req && req.query && req.query.requestNumber ? req.query.requestNumber : '';
      let value;
      let query;
      if (_id) {
        query = `SELECT * FROM userRequests WHERE requestNumber=?;`;
        value = _id;
      } else {
        return res.status(400).send({ status: 400, message: 'failure', reason: 'Invalid query' });
      }
      const result = await executeQuery(query, [value]);
      if (result && result.length) {
        const userData = await executeQuery(`SELECT * FROM simDetails WHERE id=?`, [result[0].fk_simId]);
        if (userData && userData.length) result.push(userData[0]);
      }
      console.log("=====result======",result)
      return res.status(200).send({ status: 200, message: 'success', result: result });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', result: { error: err.message } });
    }
  },

  async userRequestStateChange(req, res) {
    try {
      const { requestNumber, state, resolution, approvedOrRejectedBy } = req.body ? req.body : {};
      if (requestNumber && state && resolution && approvedOrRejectedBy) {
        let approveStatus = req.body && req.body.isApprove === true ? 'Approved' : req.body.isApprove === false ? 'Rejected' : 'Pending';
        const recordExists = (await executeQuery("SELECT * from userRequests WHERE requestNumber=?", [requestNumber]))[0];
        if (!recordExists) {
          return res.status(400).send({ status: 400, message: 'failure', reason: "Status Id error" });
        }
        if(state==1 || state==2){
          if(state==1){
            var stateVal = 'A';
          }else if(state==2){
            var stateVal = 'S';
          }else{
            var stateVal = 'D';
          }
          const stateExists = (await executeQuery("SELECT * from status WHERE id=?", [state]))[0];
            if (!stateExists) {
              return res.status(400).send({ status: 400, message: 'failure', reason: "Status Id error" });
            }
          const reqnoExists = (await executeQuery("SELECT requestNumber, fk_simId from userRequests WHERE requestNumber=?", [requestNumber]))[0];
            if (!reqnoExists) {
              return res.status(400).send({ status: 400, message: 'failure', reason: "Request Id error" });
            }
          const simExists = (await executeQuery("SELECT deviceId from simDetails WHERE id=?", [reqnoExists.fk_simId]))[0];
            if (!simExists) {
              return res.status(400).send({ status: 400, message: 'failure', reason: "Device Id error" });
            }
          if (reqnoExists && reqnoExists.requestNumber && reqnoExists.fk_simId) {
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
              const responseData = await fetch(`https://api-stg.trimble.com/t/trimble.com/getframewireless-stg/1.0/sim?State=${stateVal}`, {
                //const responseData = await fetch(STATE_CHANGE_API, {
                method: 'POST',
                body: JSON.stringify(body_val),
                headers: headers1
              });
              const resData = await responseData.json();
              if (resData && resData.status === 'success') {
                await executeQuery(
                  "UPDATE userRequests SET fk_assignedTo=?, fk_requestedState=?, resolution=?, status=?, updateUTC=?, closedDate=? WHERE requestNumber=?;",
                  [
                    approvedOrRejectedBy,
                    state,
                    resolution,
                    approveStatus,
                    new Date(),
                    new Date(),
                    requestNumber
                  ]
                );
                //updating resolvedBy name to the notifications
                await executeQuery(
                  "UPDATE notifications SET fk_resolvedBy=?, updateUTC=? WHERE fk_userRequestsId=?;",
                  [
                    approvedOrRejectedBy,
                    new Date(),
                    recordExists.id
                  ]
                );
                const simId = await executeQuery(`SELECT fk_simId FROM userRequests where requestNumber=?;`,[requestNumber]);
                //updating isRequested field in the simDetials after resolving the userRequests
                await executeQuery(
                  "UPDATE simDetails SET isRequested=? WHERE id=?;",
                  [
                    0,
                    simId[0].fk_simId
                  ]
                );
                return res.status(200).send({ status: 200, message: 'Success', reason: 'state changed' });
              } else {
                return res.status(400).send({ status: 400, message: 'failure', reason: "Invalid device id" });
              }
            }else throw 'Authentication Failure: Unable to authenticate to device Id api.';
          }else {
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
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  },

  async delete(req, res) {
    try {
      let recordId = req && req.query && req.query.id ? req.query.id : '';
      await executeQuery("DELETE FROM `userRequests` WHERE id=?", [recordId]);
      return res.status(200).send({ status: 200, message: 'success', reason: 'Deleted successfully', result: { id: recordId } });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', result: { error: err.message } });
    }
  },
};
