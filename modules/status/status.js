const executeQuery = require("../../database");
const {
  formSetClause
} = require('../../utils')

module.exports = {

    async create(req, res) {
        try {
          const result = await executeQuery(
            "INSERT INTO status (id, name, description, insertUTC, updateUTC) VALUES (?, ?, ?)",
            [
              req.body.id,
              req.body.name,
              req.body.description,
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
    
  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `status`");
      return res.status(200).send({ data: result });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  },
  async deleteAllStatus(req, res){
    console.log("=====insidt========")
    try{
      const result = await executeQuery("DELETE from status");
        return res.status(200).send({ message: 'Deleted successfully', data: result});
    } catch(error){
      console.log("====eerer=====",error)
    }
  },
  async delete(req, res) {
    try {
      let recordId = req && req.query && req.query.id ? req.query.id : '';
      await executeQuery("DELETE FROM `status` WHERE id=?", [recordId]);
      return res.send({ status: 200, message: 'success', reason: 'Deleted successfully', result: { id: recordId } });
    } catch (err) {
      return res.send({ status: 400, message: 'failure', result: { error: err.message } });
    }
  },
};
