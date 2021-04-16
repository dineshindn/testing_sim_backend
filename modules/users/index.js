const executeQuery = require('../../database');

module.exports = {

  async create(req, res) {
    try {
      const result = await executeQuery(
        "INSERT INTO users (firstName, lastName, role, fk_oem, mobileNumber, insertUTC, updateUTC, clientId, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [req.body.firstName, req.body.lastName, req.body.role, req.body.oem, req.body.mobileNumber, req.body.insertUTC, req.body.updateUTC, req.body.clientId, req.body.email]);

      return res.status(200).send({ status: 200, message: 'Success', data: { id: result.insertId } });
    } catch (err) {
      console.log(err)
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  },

  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `users`");
      return res.status(200).send({ status: 200, message: 'Success', data: result });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  },

  async delete(req, res) {
    try {
      await executeQuery("DELETE FROM `users` WHERE id=?", [req.params.id]);
      return res.status(200).send({ status: 200, message: 'Success', reason: "Deleted Successfully" });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  },

};