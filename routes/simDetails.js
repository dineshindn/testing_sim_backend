const executeQuery = require("../database");
const {
  formSetClause
} = require('../utils')

module.exports = {
  async create(req, res) {
    try {
      const result = await executeQuery(
        "INSERT INTO simDetails (deviceId, simNumber, deviceSerialNumber, imeiNumber, fk_networkProviderId, fk_oem, vinMsnNumber, registrationNumber, fk_subscriptionStatus, subscriptionEndDate, mobileNumber, fk_status, stateChangeDate, dispatchDate, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          req.body.deviceId,
          req.body.simNumber,
          req.body.deviceSerialNumber,
          req.body.imeiNumber,
          req.body.fk_networkProviderId,
          req.body.fk_oem,
          req.body.vinMsnNumber,
          req.body.registrationNumber,
          req.body.fk_subscriptionStatus,
          req.body.subscriptionEndDate,
          req.body.mobileNumber,
          req.body.fk_status,
          req.body.stateChangeDate,
          req.body.dispatchDate,
          new Date(),
          new Date()
        ]
      );

      return res.status(200).send({ message: 'Created successfully', data: { id: result.insertId } });
    } catch (err) {
      console.log(err);
      return res.status(400).send({ error: err.sqlMessage });
    }
  },

  async update(req, res) {
    const whiteListedColumns = [
      "deviceId",
      "simNumber",
      "deviceSerialNumber",
      "imeiNumber",
      "fk_networkProviderId",
      "fk_oem",
      "vinMsnNumber",
      "registrationNumber",
      "fk_subscriptionStatus",
      "subscriptionEndDate",
      "mobileNumber",
      "fk_status",
      "stateChangeDate",
      "dispatchDate",
    ];
    try {
      let { setClause, values } = await formSetClause(req.body, whiteListedColumns);
      setClause +=', updateUTC=?';

      const sim = (await executeQuery("SELECT id from simDetails WHERE id=?", [req.query.id]))[0];
      if (!sim) return res.status(404).send({ error: "Record not found" });

      let updateQuery = `UPDATE simDetails` + setClause + " WHERE id=?";
      values.push(new Date());
      values.push(sim.id)
      const result = await executeQuery(updateQuery, values);
      return res.status(200).send({ message: 'Updated successfully',  data: {id: sim.id} });
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

  async getSimDetailsById(req, res) {
    let _q = req && req.query ? req.query : "";
    let value;
    let query;
    if (_q && _q.id) {
      query = "SELECT * FROM `simDetails` WHERE id=?";
      value = _q.id;
    } else if (_q && _q.simNumber) {
      query = "SELECT * FROM `simDetails` WHERE simNumber=?";
      value = _q.simNumber;
    }
    try {
      const result = await executeQuery(query, [value]);
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },

  async delete(req, res) {
    try {
      await executeQuery("DELETE FROM `simDetails` WHERE id=?", [req.query.id]);
      return res.status(200).send({ message: "Deleted Successfully" });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },
};
