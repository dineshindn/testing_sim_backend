const executeQuery = require("../database");
const {
  formSetClause
} = require('../utils')

module.exports = {
  async create(req, res) {
    try {
      const result = await executeQuery(
        "INSERT INTO simDetails (deviceId, simNumber, deviceSerialNumber, imeiNumber, fk_networkProviderId, fk_oem, vinMsnNumber, registrationNumber, subscriptionStatus, subscriptionEndDate, mobileNumber, fk_status, stateChangeDate, dispatchDate, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          req.body.deviceId,
          req.body.simNumber,
          req.body.deviceSerialNumber,
          req.body.imeiNumber,
          req.body.fk_networkProviderId,
          req.body.fk_oem,
          req.body.vinMsnNumber,
          req.body.registrationNumber,
          req.body.subscriptionStatus,
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
      const { simNumber, deviceId, mobileNumber } = req && req.query ? req.query : {};
      const limit = req && req.query && req.query.limit ? req.query.limit : 10;
      const page = req && req.query && req.query.page ? req.query.page : 1;
      var offset;
      offset = (page - 1) * limit;
      offset = Number.isNaN(offset) ? 0 : offset;
      let value;
      let query;
      if (simNumber || deviceId || mobileNumber) {
        if (simNumber) {
          query = `SELECT * FROM simDetails WHERE simNumber REGEXP ${simNumber} limit ${limit} offset ${offset};`;
          value = simNumber;
        } else if (deviceId) {
          query = `SELECT * FROM simDetails WHERE deviceId REGEXP ${deviceId} limit ${limit} offset ${offset};`;
          value = deviceId;
        } else if (mobileNumber) {
          query = `SELECT * FROM simDetails WHERE mobileNumber REGEXP ${mobileNumber} limit ${limit} offset ${offset};`;
          value = mobileNumber;
        }
      } else {
        query = `SELECT * FROM simDetails limit ${limit} offset ${offset};`;
      }
      const result = await executeQuery(query, [value]);
      const totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails;`);
      const responseJson = {
        'totalCount': parseInt(Object.values(totalRecords[0]).join(",")),
        'pageCount': result.length,
        'pageNumber': page,
        'data': result
      }
      return res.send({ status: 200, message: 'success', result: responseJson });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },

  async getSimDetailsById(req, res) {
    try {
      let _id = req && req.query && req.query.id ? req.query.id : '';
      let value;
      let query;
      if (_id) {
        query = `SELECT * FROM simDetails WHERE id=?;`;
        value = _id;
      } else {
        return res.send({ status: 400, message: 'failure', reason: 'Invalid query', result: { error: err.message } });
      }
      const result = await executeQuery(query, [value]);
      return res.send({ status: 200, message: 'success', result: result });
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
      const { simId, statusId } = req.body ? req.body : {};
      if (simId && statusId) {
        const recordExists = (await executeQuery("SELECT * from status WHERE id=?", [statusId]))[0];
        if (!recordExists) {
          return res.send({ status: 400, message: 'failure', reason: "Status Id error" });
        }
        await executeQuery(
          "UPDATE simDetails SET fk_status=?, updateUTC=? WHERE id=?;",
          [
            statusId,
            new Date(),
            simId
          ]
        );
        return res.send({ status: 200, message: 'Success', reason: 'state changed' });
      } else {
        return res.send({ status: 400, message: 'failure', reason: "Invalid post data" });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).send({ error: err.message });
    }
  }
};
