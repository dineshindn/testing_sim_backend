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
    
          return res.status(200).send({ status: 200, message: 'success', reason: 'Created successfully', data: { id: result.insertId } });
        } catch (err) {
          console.log(err);
          return res.status(400).send({ status: 400, message: 'failure', reason:'something went wrong', error: err.message });
        }
      },
    
  async list(req, res) {
    try {
      const result = await executeQuery("SELECT * FROM `status`");
      return res.status(200).send({  status: 200, message: 'success', reason: 'Created successfully', data: result });
    } catch (err) {
      return res.status(500).send({ status: 500, message: 'failure', reason:'something went wrong', error: err });
    }
  },
  async deleteAllStatus(req, res){
    console.log("=====insidt========")
    try{
      const result = await executeQuery("DELETE from status");
        return res.status(200).send({  status: 200, message: 'success', message: 'Deleted successfully', data: result});
    } catch(error){
      return res.status(400).send({ status: 400, message: 'failure', reason:'something went wrong', error: error.message });
    }
  },
  async delete(req, res) {
    try {
      let recordId = req && req.query && req.query.id ? req.query.id : '';
      await executeQuery("DELETE FROM `status` WHERE id=?", [recordId]);
      return res.status(200).send({ status: 200, message: 'success', reason: 'Deleted successfully', result: { id: recordId } });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason:'something went wrong', result: { error: err.message } });
    }
  },
};
