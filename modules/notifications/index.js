const executeQuery = require('../../database');

module.exports = {
  async list(req, res) {
    try {
    const result = await executeQuery("SELECT * FROM `notifications`");
    //   const result = await executeQuery("SELECT notifications.*, users.firstName AS createdByName FROM `notifications` LEFT JOIN `users` ON notifications.fk_createdBy = users.id" );

      return res.status(200).send({ status: 200, message: 'Success', data: result });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  }
};