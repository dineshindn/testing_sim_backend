const executeQuery = require("../../database");

module.exports = {

  async create(req, res) {
    try {
      const result = await executeQuery(
        "INSERT INTO simSwap (fk_oldSim, fk_newSim, reasonForSimReplacement, fk_createdBy, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?)",
        [
          req.body.fk_oldSim,
          req.body.fk_newSim,
          req.body.reasonForSimReplacement,
          req.body.fk_createdBy,
          new Date(),
          new Date()
        ]
      );
      return res.send({ status: 200, message: 'success', reason: 'Sim Swapped Successfully', result: { id: result.insertId} });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },

  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `simSwap`");
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }
};
