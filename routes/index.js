const users = require("./users");
const simDetails = require("./simDetails");

module.exports = (app) => {
  app.get("/api/v1/health-check", (req, res) =>
    res.status(200).send({
      message: "Ok",
    })
  );

  //users
  app.get("/simmanager/api/v1/users", users.list);
  app.post("/simmanager/api/v1/users", users.create);
  app.delete("/simmanager/api/v1/users", users.delete);

  //simDetails
  app.get("/simmanager/api/v1/simDetails", simDetails.list);
  app.post("/simmanager/api/v1/simDetails", simDetails.create);
  app.delete("/simmanager/api/v1/simDetails", simDetails.delete);
  app.patch("/simmanager/api/v1/simDetails", simDetails.update);
  app.post("/simmanager/api/v1/getSimDetailsById", simDetails.getSimDetailsById);

};
