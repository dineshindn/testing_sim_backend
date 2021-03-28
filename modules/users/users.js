const executeQuery = require('../../database');

module.exports = {

  async create(req, res) {
    try {
      const result = await executeQuery(
        "INSERT INTO users (firstName, lastName, role, fk_oem, mobileNumber, insertUTC, updateUTC, clientId, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [req.body.firstName, req.body.lastName, req.body.role, req.body.oem, req.body.mobileNumber, req.body.insertUTC, req.body.updateUTC, req.body.clientId, req.body.email]);

      return res.status(200).send({ data: { id: result.insertId } });
    } catch (err) {
      console.log(err)
      return res.status(400).send({ error: err.sqlMessage });
    }
  },

  async list(req, res) {
    let values = [];
    let query = "SELECT a.id, a.firstName, a.lastName, a.role FROM users a";

    try {
      const result = await executeQuery(query, values);
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },

  async delete(req, res) {
    try {
      await executeQuery("DELETE FROM `users` WHERE id=?", [req.params.id]);
      return res.status(200).send({ message: "Deleted Successfully" });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },

};