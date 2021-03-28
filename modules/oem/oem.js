const executeQuery = require("../../database");
const {
  formSetClause
} = require('../../utils')

module.exports = {

  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `oem`");
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }
};
