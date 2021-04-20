const executeQuery = require("../../database");
var async = require('async');
var _ = require('lodash');
var randomize = require('randomatic');

const {
  formSetClause
} = require('../../utils');

let finalData = [];
const getReport = async (rowData, next) => {
  try {
    const reqState = await executeQuery(`SELECT name FROM requestStatus WHERE id=?;`, [rowData.fk_requestedState]);
    const assignedName = await executeQuery(`SELECT firstName FROM users WHERE id=?;`, [rowData.fk_assignedTo]);
    const createdName = await executeQuery(`SELECT firstName FROM users WHERE id=?;`, [rowData.fk_createdBy]);
    const sim = await executeQuery(`SELECT simNumber FROM simDetails WHERE id=?;`, [rowData.fk_simId]);
    if (reqState && reqState[0].name) rowData['requested state'] = reqState[0].name;
    if (assignedName && assignedName[0].firstName) rowData['assigned to'] = assignedName[0].firstName;
    if (createdName && createdName[0].firstName) rowData['created by'] = createdName[0].firstName;
    if (sim && sim[0].simNumber) rowData['sim number'] = sim[0].simNumber;
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


module.exports = {

  async create(req, res) {
    try {
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
        "INSERT INTO notifications (fk_createdBy, fk_simId, fk_userRequestsId, fk_resolvedBy, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?)",
        [
          req.body.fk_createdBy,
          req.body.fk_simId,
          result.insertId,
          null,
          new Date(),
          new Date()
        ]
      );
      return res.status(200).send({ status: 200, message: 'success', reason: 'Created Successfully', result: { id: result.insertId, requestNumber: request.requestNumber } });
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
      const { requestNumber, comments, requestedState, requestedStateSort, commentsSort, resolution, resolutionSort, raisedDate, raisedDateSort, closedDate, closedDateSort, status, statusSort, assignedTo, createdBy, isDownload } = req && req.query ? req.query : {};

      const limit = req && req.query && req.query.limit ? req.query.limit : 10;
      const page = req && req.query && req.query.page ? req.query.page : 1;
      const sort = req && req.query && req.query.page ? req.query.sort : '';

      var offset;
      offset = (page - 1) * limit;
      offset = Number.isNaN(offset) ? 0 : offset;
      let value;
      let query;
      if (requestNumber || requestedState || requestedStateSort || comments || commentsSort || resolution || resolutionSort || raisedDate || raisedDateSort || closedDate || closedDateSort || status || statusSort || assignedTo || createdBy) {
        if (requestNumber) {
          query = `SELECT * FROM userRequests WHERE requestNumber REGEXP '${requestNumber}' limit ${limit} offset ${offset};`;
          value = requestNumber;
        } else if (comments || commentsSort) {
          query = commentsSort ? `SELECT * FROM userRequests ORDER BY comments ${commentsSort} limit ${limit} offset ${offset};` : `SELECT * FROM userRequests WHERE comments REGEXP '${comments}' limit ${limit} offset ${offset};`;
          value = comments;
        } else if (status) {
          query = status == 'ALL' ? `SELECT * FROM userRequests limit ${limit} offset ${offset};` : `SELECT * FROM userRequests WHERE status REGEXP '${status}' limit ${limit} offset ${offset}`;
          value = status;
        } else if (statusSort) {
          query = `SELECT * FROM userRequests ORDER BY status ${statusSort} limit ${limit} offset ${offset};`
          value = statusSort;
        } else if (requestedState) {
          if (requestedState === 'ALL') {
            query = `SELECT * FROM userRequests limit ${limit} offset ${offset};`
          } else {
            const reqStateId = (await executeQuery(`SELECT id FROM requestStatus WHERE name REGEXP '${requestedState}';`))[0]
            let _id = reqStateId && reqStateId.id ? reqStateId.id : ''
            query = `SELECT * FROM userRequests WHERE fk_requestedState=? limit ${limit} offset ${offset};`;
          }
          value = _id;
        }
        // else if (requestedStateSort) {
        //   const reqStateId = (await executeQuery(`SELECT id FROM requestStatus WHERE name=?`, [requestedStateSort]))[0];
        //   query = `SELECT * FROM userRequests WHERE fk_requestedState REGEXP ${reqStateId.id} limit ${limit} offset ${offset};`;
        //   value = reqStateId.id;
        // } 
        else if (raisedDate || raisedDateSort) {
          query = raisedDateSort ? `SELECT * FROM userRequests ORDER BY raisedDate ${raisedDateSort};` : `SELECT * FROM userRequests WHERE raisedDate=?`;
          value = raisedDate;
        } else if (closedDate || closedDateSort) {
          query = closedDateSort ? `SELECT * FROM userRequests ORDER BY closedDate ${closedDateSort};` : `SELECT * FROM userRequests WHERE closedDate=?`;
          value = closedDate;
        } else if (resolution || resolutionSort) {
          query = resolutionSort ? `SELECT * FROM userRequests ORDER BY resolution ${resolutionSort} limit ${limit} offset ${offset};` : `SELECT * FROM userRequests WHERE resolution REGEXP '${resolution}' limit ${limit} offset ${offset};`;
          value = resolution;
        } else if (assignedTo) {
          const assignedId = (await executeQuery(`SELECT id FROM users WHERE firstName REGEXP '${assignedTo}';`))[0]
          let _id = assignedId && assignedId.id ? assignedId.id : ''
          query = `SELECT * FROM userRequests WHERE fk_assignedTo=? limit ${limit} offset ${offset};`;
          value = _id;
        } else if (createdBy) {
          const createdById = (await executeQuery(`SELECT id FROM users WHERE firstName REGEXP '${createdBy}';`))[0]
          let _id = createdById && createdById.id ? createdById.id : ''
          query = `SELECT * FROM userRequests WHERE fk_createdBy=? limit ${limit} offset ${offset};`;
          value = _id;
        }
      } else {
        query = `SELECT * FROM userRequests limit ${limit} offset ${offset};`;
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
        const totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests;`);
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

        return res.status(200).send({ status: 200, message: 'Success', reason: 'state changed' });
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
