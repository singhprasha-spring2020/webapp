const Sequelize = require('sequelize');
const validator = require('../validator');
const uuidv4 = require('uuidv4');
const bcrypt = require('bcrypt');

module.exports = function(app) {
  const { User } = require('../db');
  app.post('/v1/user', async (req, res) => {
    try {
      const passw = req.body.password;
      validator.checkPasswStrength(passw);
      const hash = await bcrypt.hash(req.body.password, 10);
      let users = await User.create({
        id: uuidv4.uuid(),
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        password: hash,
        email_address: req.body.email_address
      });

      users = users.toJSON();

      delete users.password;
      res.status(201).send(users);
    } catch (error) {
      let message = null;
      if (error instanceof Sequelize.ValidationError) {
        message = error.errors[0].message;
      }
      res.status(400).send(message || error.toString());
    }
  });

  app.get('/v1/user/self', async (req, res) => {
    try {
      let user = await validator.validateAndGetUser(req, User);
      user = user.toJSON();
      delete user.password;
      res.status(200).send(user);
    } catch (error) {
      res.status(400).send(error.toString());
    }
  });

  app.put('/v1/user/self', async (req, res) => {
    try {
      let user = await validator.validateAndGetUser(req, User);

      if (req.body.first_name) {
        user.first_name = req.body.first_name;
      }
      if (req.body.last_name) {
        user.last_name = req.body.last_name;
      }
      if (req.body.password) {
        validator.checkPasswStrength(req.body.password);
        const hash = await bcrypt.hash(req.body.password, 10);
        user.password = hash;
      }
      await user.save();
      res.status(204).send();
    } catch (error) {
      res.status(400).send(error.toString());
    }
  });
};