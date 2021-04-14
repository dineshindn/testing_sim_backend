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
      await executeQuery(`UPDATE simDetails SET deviceId=? WHERE id=?`,[req.body.deviceId, req.body.fk_newSim]);
      await executeQuery(`UPDATE simDetails SET deviceId=? WHERE id=?`,['', req.body.fk_oldSim]);
      return res.send({ status: 200, message: 'success', reason: 'Sim Swapped Successfully', result: { id: result.insertId} });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },

  async list(req, res) {
    try {
      const result = await executeQuery("SELECT simSwap.*, users.firstName, simDetails.deviceId as oldSimDeviceId FROM `simSwap` LEFT JOIN `users` ON simSwap.fk_createdBy = users.id LEFT JOIN `simDetails` ON fk_oldSim = simDetails.id" );
      //const result = await executeQuery("SELECT * FROM `simSwap`");
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }
};
