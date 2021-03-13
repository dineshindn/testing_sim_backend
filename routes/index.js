const users = require("./users");
const simDetails = require("./simDetails");
const oem = require("./oem");
const networkProvider = require("./networkProvider");
const status = require("./status");
const stats = require("./stats");

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
  app.get("/simmanager/api/v1/getSimDetailsById", simDetails.getSimDetailsById);
  app.post("/simmanager/api/v1/simStateChange", simDetails.simStateChange);

  //oem
  app.get("/simmanager/api/v1/oem", oem.list);

  //networkProvider
  app.get("/simmanager/api/v1/networkProvider", networkProvider.list);
  //app.patch("/simmanager/api/v1/networkProvider", networkProvider.update);

  //status
  //app.post("/simmanager/api/v1/status", users.create);
  app.get("/simmanager/api/v1/status", status.list);
  // app.delete("/simmanager/api/v1/status", status.delete);
  // app.get("/simmanager/api/v1/deleteAllStatus", status.deleteAllStatus);

  //stats
  app.get("/simmanager/api/v1/stats/getSimStateCount", stats.getSimStateCount);
  app.get("/simmanager/api/v1/stats/getProviderCount", stats.getProviderCount);
  app.get("/simmanager/api/v1/stats/getOemCount", stats.getOemCount);


};
