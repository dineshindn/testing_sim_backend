const executeQuery = require('../../database');

module.exports = {
  async list(req, res) {
    try {
        const result = await executeQuery("SELECT * FROM `notifications`");
      //   const result = await executeQuery("SELECT notifications.*, users.firstName AS createdByName FROM `notifications` LEFT JOIN `users` ON notifications.fk_createdBy = users.id " );

      return res.status(200).send({ status: 200, message: 'Success', data: result });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const notifiyId = req.body && req.body.notificationId ? req.body.notificationId : '';
      if (!notifiyId) return res.status(400).send({ status: 400, message: 'failure', reason: 'Invalid notificationId', error: err.message });
      await executeQuery(`UPDATE notifications SET isRead=?, updateUTC=? WHERE id=?`, [1, new Date(), notifiyId]);
      return res.status(200).send({ status: 200, message: 'Success' });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  }
};