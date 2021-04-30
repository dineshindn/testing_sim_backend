const executeQuery = require('../../database');

module.exports = {
  async list(req, res) {
    try {
      const result = await executeQuery("SELECT notifications.*, userRequests.requestNumber FROM `notifications` LEFT JOIN `userRequests` ON notifications.fk_userRequestsId = userRequests.id WHERE isRead=0" );

      // const result = await executeQuery("SELECT notifications.*, userRequests.requestNumber, users.firstName AS createdByName FROM `notifications` LEFT JOIN `userRequests` ON notifications.fk_userRequestsId = userRequests.id LEFT JOIN `users` ON notifications.fk_createdBy = users.id AND fk_resolvedBy" );
      return res.status(200).send({ status: 200, message: 'Success', data: result });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const notifiyId = req.body && req.body.notificationId ? req.body.notificationId : '';
      if (!notifiyId) return res.status(400).send({ status: 400, message: 'failure', reason: 'Invalid notificationId' });
      await executeQuery(`UPDATE notifications SET isRead=?, updateUTC=? WHERE id=?`, [1, new Date(), notifiyId]);
      return res.status(200).send({ status: 200, message: 'Success' });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  }
};