const users = require("../modules/users/index");
const simDetails = require("../modules/simDetails");
const oem = require("../modules/oem");
const networkProvider = require("../modules/networkProvider");
const status = require("../modules/status");
const stats = require("../modules/stats");
const bulkCreate = require("../modules/bulkcreate");
const userRequests = require("../modules/userRequests");
const requestState = require("../modules/requestState");
const simSwap = require("../modules/simSwap");
const notifications = require("../modules/notifications");
const simTransactionHistory = require("../modules/simTransactionHistory");

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

  //bulkCreate
  app.post("/simmanager/api/v1/bulkCreate", bulkCreate.simBulkUpload);

  //userRequests
  app.post("/simmanager/api/v1/userRequests", userRequests.create);
  app.get("/simmanager/api/v1/userRequests", userRequests.list);
  app.delete("/simmanager/api/v1/userRequests", userRequests.delete);
  app.get("/simmanager/api/v1/getUserRequestById", userRequests.getUserRequestById);
  app.post("/simmanager/api/v1/userRequestStateChange", userRequests.userRequestStateChange);
  app.patch("/simmanager/api/v1/userRequests", userRequests.update);

  //requeststatus
  app.get("/simmanager/api/v1/requestState", requestState.list);
  app.delete("/simmanager/api/v1/requestState", requestState.delete);

  //simSwap
  app.post("/simmanager/api/v1/simSwap", simSwap.create);
  app.get("/simmanager/api/v1/simSwap", simSwap.list);
  
  //notifications
  app.get("/simmanager/api/v1/notifications", notifications.list);
  app.post("/simmanager/api/v1/markAsRead", notifications.markAsRead);

  //simTransactionHistory
  app.get("/simmanager/api/v1/simTransactionHistory", simTransactionHistory.list);

};
