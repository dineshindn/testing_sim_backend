const executeQuery = require("../database");

module.exports = {
  async create(req, res) {
    try {
      const result = await executeQuery(
        "INSERT INTO simDetails (deviceId, simNumber, deviceSerialNumber, imeiNumber, fk_networkProviderId, fk_oemId, vinMsnNumber, registrationNumber, fk_subscriptionStatus, subscriptionEndDate, mobileNumber, fk_status, stateChangeDate, dispatchDate, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          req.body.deviceId,
          req.body.simNumber,
          req.body.deviceSerialNumber,
          req.body.imeiNumber,
          req.body.fk_networkProviderId,
          req.body.fk_oemId,
          req.body.vinMsnNumber,
          req.body.registrationNumber,
          req.body.fk_subscriptionStatus,
          req.body.subscriptionEndDate,
          req.body.mobileNumber,
          req.body.fk_status,
          req.body.stateChangeDate,
          req.body.dispatchDate,
          req.body.insertUTC,
          req.body.updateUTC,
        ]
      );

      return res.status(200).send({ data: { id: result.insertId } });
    } catch (err) {
      console.log(err);
      return res.status(400).send({ error: err.sqlMessage });
    }
  },

  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `simDetails`");
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },

  async delete(req, res) {
    try {
      await executeQuery("DELETE FROM `simDetails` WHERE id=?", [req.params.id]);
      return res.status(200).send({ message: "Sim deleted Successfully" });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },
};
