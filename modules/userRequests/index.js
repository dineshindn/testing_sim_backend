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
        "INSERT INTO userRequests (requestNumber, fk_simId, requestedState, comments, fk_assignedTo, fk_createdBy, fk_requestStatus, resolution, closedDate, raisedDate, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          requestNumber,
          req.body.fk_simId,
          req.body.requestedState,
          req.body.comments,
          req.body.fk_assignedTo,
          req.body.fk_createdBy,
          req.body.fk_requestStatus,
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

  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `userRequests`");
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },

  async getUserRequestById(req, res) {
    try {
      let _id = req && req.query && req.query.id ? req.query.id : '';
      let value;
      let query;
      if (_id) {
        query = `SELECT * FROM userRequests WHERE id=?;`;
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
