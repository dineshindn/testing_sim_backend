const executeQuery = require("../../database");
var async = require('async');
var _ = require('lodash');
var randomize = require('randomatic');

const {
  formSetClause
} = require('../../utils')

module.exports = {

  async create(req, res) {
    try {
      const requestNumber = randomize('A0', 8);
      const result = await executeQuery(
        "INSERT INTO userRequests (requestNumber, fk_simId, fk_requestedState, comments, fk_assignedTo, fk_createdBy, status, resolution, closedDate, raisedDate, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          requestNumber,
          req.body.simId,
          req.body.requestedState,
          req.body.comments,
          req.body.assignedTo,
          req.body.createdBy,
          'Pending',
          req.body.resolution,
          req.body.closedDate,
          req.body.raisedDate,
          new Date(),
          new Date()
        ]
      );
      const request = (await executeQuery("SELECT requestNumber from userRequests WHERE id=?", [result.insertId]))[0];
      return res.send({ status: 200, message: 'success', reason: 'Created Successfully', result: { id: result.insertId, requestNumber: request.requestNumber } });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },

  async update(req, res) {
    req.body[ 'fk_simId' ] = req.body[ 'simId' ];
    delete req.body[ 'simId' ];
    req.body[ 'fk_requestedState' ] = req.body[ 'requestedState' ];
    delete req.body[ 'requestedState' ];
    req.body[ 'fk_assignedTo' ] = req.body[ 'assignedTo' ];
    delete req.body[ 'assignedTo' ];
    req.body[ 'fk_createdBy' ] = req.body[ 'createdBy' ];
    delete req.body[ 'createdBy' ];

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
      return res.send({ status: 200, message: 'success', reason: 'updated successfully', result: { id: record[0].id, requestNumber: record[0].requestNumber } });
    } catch (err) {
      console.log(err);
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },

  async list(req, res) {
    try {
      const limit = req && req.query && req.query.limit ? req.query.limit : 10;
      const page = req && req.query && req.query.page ? req.query.page : 1;
      const sort = req && req.query && req.query.page ? req.query.sort : '';

      var offset;
      offset = (page - 1) * limit;
      offset = Number.isNaN(offset) ? 0 : offset;
      let value;
      let query;
      query = `SELECT * FROM userRequests limit ${limit} offset ${offset};`;
      const result = await executeQuery(query, [value]);
      const totalRecords = await executeQuery(`SELECT COUNT(*) FROM userRequests;`);
      const responseJson = {
        'totalCount': parseInt(Object.values(totalRecords[0]).join(",")),
        'pageCount': result.length,
        'pageNumber': page,
        'data': result
      }
      return res.send({ status: 200, message: 'success', result: responseJson });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
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
        return res.send({ status: 400, message: 'failure', reason: 'Invalid query', result: { error: err.message } });
      }
      const result = await executeQuery(query, [value]);
      if (result && result.length) {
        const userData = await executeQuery(`SELECT * FROM simDetails WHERE id=?`, [result[0].fk_simId]);
        if (userData && userData.length) result.push(userData[0]);
      }
      return res.send({ status: 200, message: 'success', result: result });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },

  async userRequestStateChange(req, res) {
    try {
      const { requestNumber, state, resolution } = req.body ? req.body : {};
      if (requestNumber && state && resolution) {
        let approveStatus = req.body && req.body.isApprove === true ? 'Approved' : req.body.isApprove === false ? 'Rejected' : 'Pending';
        const recordExists = (await executeQuery("SELECT * from userRequests WHERE requestNumber=?", [requestNumber]))[0];

        if (!recordExists) {
          return res.send({ status: 400, message: 'failure', reason: "Status Id error" });
        }
        await executeQuery(
          "UPDATE userRequests SET fk_requestedState=?, resolution=?, status=?, updateUTC=?, closedDate=? WHERE requestNumber=?;",
          [
            state,
            resolution,
            approveStatus,
            new Date(),
            new Date(),
            requestNumber
          ]
        );
        return res.send({ status: 200, message: 'Success', reason: 'state changed' });
      } else {
        return res.send({ status: 400, message: 'failure', reason: "Invalid post data" });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).send({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      let recordId = req && req.query && req.query.id ? req.query.id : '';
      await executeQuery("DELETE FROM `userRequests` WHERE id=?", [recordId]);
      return res.send({ status: 200, message: 'success', reason: 'Deleted successfully', result: { id: recordId } });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },
};
