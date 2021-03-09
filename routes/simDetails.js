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
      values.push(sim.id);
      const result = await executeQuery(updateQuery, values);
      return res.status(200).send({ message: 'Updated successfully',  data: {id: sim.id} });
    } catch (err) {
      console.log(err);
      return res.status(400).send({ error: err.sqlMessage });
    }
  },
  
  async list(req, res) {
    try {
      const limit = req && req.query && req.query.limit ? req.query.limit : 10;
      const page = req && req.query && req.query.page ? req.query.page : 1;
      var offset;
      offset = (page - 1) * limit;
      offset = Number.isNaN(offset) ? 0 : offset;
      let sql = `SELECT * FROM simDetails limit ` + limit + ` offset ` + offset;
      const result = await executeQuery(sql);
      const totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails;`)
      const responseJson = {
        'totalCount': totalRecords,
        'pageCount': result.length,
        'pageNumber': page,
        'data': result
      }
      return res.status(200).send(responseJson);
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },

  async getSimDetailsById(req, res) {
    try {
      let _q = req && req.query ? req.query : {};
      let value;
      let query;
      if (_q && Object.keys(_q).length === 0 && _q.constructor === Object) {
        return res.send({ message: 'Invalid query' })
      }
      if (_q.id) {
        query = "SELECT * FROM `simDetails` WHERE id=?";
        value = _q.id;
      } else if (_q.simNumber) {
        query = "SELECT * FROM `simDetails` WHERE simNumber=?";
        value = _q.simNumber;
      } else if (_q.deviceId) {
        query = "SELECT * FROM `simDetails` WHERE deviceId=?";
        value = _q.deviceId;
      } else if (_q.mobileNumber) {
        query = "SELECT * FROM `simDetails` WHERE mobileNumber=?";
        value = _q.mobileNumber;
      }
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
