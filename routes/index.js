const users = require('./users');

module.exports = (app) => {
  app.get('/api/v1/health-check', (req, res) => res.status(200).send({
    message: 'Ok',
  }));

  //users
  app.get('/api/v1/users', users.list);
  app.post('/api/v1/users', users.create);
  app.delete('/api/v1/users', users.delete);

};