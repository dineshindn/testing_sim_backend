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

      return res.send({ status: 200, message: 'success', reason: 'Created Successfully' ,result: { id: result.insertId } });
    } catch (err) {
      console.log(err);
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
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
      return res.send({ status: 200, message: 'success', reason: 'updated successfully' ,result: { id: sim.id } });
    } catch (err) {
      console.log(err);
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
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
      const totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails;`);
      const responseJson = {
        'totalCount': parseInt(Object.values(totalRecords[0]).join(",")),
        'pageCount': result.length,
        'pageNumber': page,
        'data': result
      }
      return res.send({ status: 200, message: 'success' ,result: responseJson });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
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
      return res.send({ status: 200, message: 'success' ,result: result });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },

  async delete(req, res) {
    try {
      let recordId = req && req.query && req.query.id ? req.query.id : '';
      await executeQuery("DELETE FROM `simDetails` WHERE id=?", [recordId]);
      return res.send({ status: 200, message: 'success', reason: 'Deleted successfully', result: { id: recordId } });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },

  async simStateChange(req, res) {
    try {
      const { simId, fk_subscriptionStatus } = req.body ? req.body : {};
      if (simId && fk_subscriptionStatus) {
        let statusId;
        const recordExists = (await executeQuery("SELECT * from status WHERE name=?", [fk_subscriptionStatus]))[0];
        if (recordExists && recordExists.id) {
          statusId = recordExists.id;
        } else {
          const result = await executeQuery(
            "INSERT INTO status (name, description, insertUTC, updateUTC) VALUES (?, ?, ?, ?)",
            [
              fk_subscriptionStatus,
              fk_subscriptionStatus,
              new Date(),
              new Date()
            ]
          );
          statusId = result.insertId
        }
        await executeQuery(
          "UPDATE simDetails SET fk_subscriptionStatus=?, updateUTC=? WHERE id=?;",
          [
            statusId,
            new Date(),
            simId
          ]
        );
        return res.send({ status: 200, message: 'Success', reason: 'state changed' });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).send({ error: "Something went wrong" });
    }
  }
};
