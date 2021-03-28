const executeQuery = require("../../database");
const {
  formSetClause
} = require('../../utils')

module.exports = {

    async create(req, res) {
        try {
          const result = await executeQuery(
            "INSERT INTO networkProvider (name) VALUES (?)",
            [
              req.body.name
            ]
          );
    
          return res.status(200).send({ message: 'Created successfully', data: { id: result.insertId } });
        } catch (err) {
          console.log(err);
          return res.status(400).send({ error: err.sqlMessage });
        }
      },
    
      async update(req, res) {
        try {
          const result = await executeQuery(
            "UPDATE networkProvider SET name = ?, updateUTC=? WHERE id = 1",
            [
              req.body.name,
              new Date()
              
            ]
          );
    
          return res.status(200).send({ message: 'updated successfully', data: { id: result } });
        } catch (err) {
          console.log(err);
          return res.status(400).send({ error: err.sqlMessage });
        }
      },
  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `networkProvider`");
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }
};
