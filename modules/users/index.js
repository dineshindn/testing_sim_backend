const executeQuery = require("../../database");
const pagePermissionsObject = require("../../pagePermissions.json");
const columnPermissionsObject = require("../../columnPermissions.json");

module.exports = {
  async create(req, res) {
    try {
      const result = await executeQuery(
        "INSERT INTO users (userName, uuid, role, email) VALUES (?, ?, ?, ?)",
        [req.body.userName, req.body.uuid, req.body.role, req.body.email]
      );

      return res
        .status(200)
        .send({
          status: 200,
          message: "Success",
          data: { id: result.insertId },
        });
    } catch (err) {
      console.log(err);
      return res
        .status(400)
        .send({
          status: 400,
          message: "failure",
          reason: "something went wrong",
          error: err.message,
        });
    }
  },

  async list(req, res) {
    const { uuid } = req.query ? req.query : {};
    try {
      let query;
      let value;
      if (uuid) {
        query = `SELECT * FROM users WHERE uuid=?;`;
        value = uuid;
      } else {
        query = `SELECT * FROM users;`;
      }
      const result = await executeQuery(query, [value]);
      result &&
        result.length &&
        result.forEach((e) => {
          if (e.role) {
            //pagePermissions
            if (pagePermissionsObject.hasOwnProperty(e.role) === true) {
              e.pagePermissions = pagePermissionsObject[e.role];
            }

            //columnPermissions
            if (columnPermissionsObject.hasOwnProperty(e.role) === true) {
              e.columnPermissions = columnPermissionsObject[e.role];
            }
          }
        });
      return res
        .status(200)
        .send({ status: 200, message: "Success", data: result });
    } catch (err) {
      return res
        .status(400)
        .send({
          status: 400,
          message: "failure",
          reason: "something went wrong",
          error: err.message,
        });
    }
  },

  async delete(req, res) {
    try {
      await executeQuery("DELETE FROM `users` WHERE id=?", [req.query.id]);
      return res
        .status(200)
        .send({
          status: 200,
          message: "Success",
          reason: "Deleted Successfully",
        });
    } catch (err) {
      return res
        .status(400)
        .send({
          status: 400,
          message: "failure",
          reason: "something went wrong",
          error: err.message,
        });
    }
  },

  async update(req, res) {
    try {
      const uid = await executeQuery("SELECT * from `users` WHERE uuid=?", [
        req.body.uuid,
      ]);
      if (uid && uid.length === 0)
        return res.status(404).send({ error: "Record not found" });
      if (
        req.body.role == 1 ||
        req.body.role == 2 ||
        req.body.role == 3 ||
        req.body.role == 4
      ) {
        const result = await executeQuery(
          "UPDATE `users` SET role=? WHERE uuid=?",
          [req.body.role, req.body.uuid]
        );
        return res
          .status(200)
          .send({ message: "updated successfully", data: { id: result } });
      } else {
        return res.status(404).send({ error: "Role does not exit" });
      }
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .send({
          status: 500,
          message: "failure",
          reason: "something went wrong",
          error: err.message,
        });
    }
  },
};
