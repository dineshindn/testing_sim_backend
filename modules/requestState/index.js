const executeQuery = require("../../database");
const {
  formSetClause
} = require('../../utils')

module.exports = {
  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `requestStatus`");
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },
  async delete(req, res) {
    try {
      let recordId = req && req.query && req.query.id ? req.query.id : '';
      await executeQuery("DELETE FROM `requestStatus` WHERE id=?", [recordId]);
      return res.send({ status: 200, message: 'success', reason: 'Deleted successfully', result: { id: recordId } });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },
};
