const executeQuery = require("../../database");
const {
  formSetClause
} = require('../../utils')

module.exports = {

  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `oem`");
      return res.status(200).send({  status: 200, message: 'success' ,data: result });
    } catch (err) {
      return res.status(500).send({  status: 500, message: 'failure' ,reason: 'something went wrong', error: err.message });
    }
  }
};
