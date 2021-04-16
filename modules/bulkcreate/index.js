const executeQuery = require("../../database");
const crypto = require('crypto');
const readXlsxFile = require('read-excel-file/node');
const { simCreate } = require('../../bulkCreateSchema');
const fetch = require('node-fetch');
var _ = require('lodash');
var async = require('async');
const authTokenUrl = process.env.AUTH_TOKEN_URL;
const basicToken = process.env.BASIC_TOKEN;
const getVinDetailsUrl = process.env.GET_VIN_DETAILS_URL


const fetchVinDetails = async (vin, uid, clientID) => {
  try {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + basicToken
    }
    const tokenDetails = await fetch(authTokenUrl, {
      method: 'Post',
      headers: headers
    });
    const tokenDetailsData = await tokenDetails.json();
    if (tokenDetailsData && tokenDetailsData.access_token) {
      const response = await fetch(getVinDetailsUrl, {
        method: 'Post',
        body: JSON.stringify({ vin, uid, clientID }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokenDetailsData.access_token
        },
      });
      const resData = await response.json();
      if (resData && resData.status === 'success') {
        if (resData.result && resData.result.length > 0) return resData.result;
        else throw 'Invalid VIN number';
      }
      else throw 'Authentication Failure: Unable to authenticate to VIN details api.';

    } else throw 'Authentication Failure: Unable to authenticate to VIN details api.';
  } catch (error) {
    throw error;
  }
}

const insertIntoSimTable = async (data, next) => {
  try {
    await executeQuery(
      "INSERT INTO simDetails (deviceId, simNumber, deviceSerialNumber, imeiNumber, fk_networkProviderId, fk_oem, vinMsnNumber, registrationNumber, subscriptionStatus, subscriptionEndDate, mobileNumber, fk_status, stateChangeDate, dispatchDate, insertUTC, updateUTC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.deviceId,
        data.simNumber,
        data.deviceSerialNumber,
        data.imeiNumber,
        data.fk_networkProviderId,
        data.fk_oem,
        data.vinMsnNumber,
        data.registrationNumber,
        data.subscriptionStatus,
        data.subscriptionEndDate,
        data.mobileNumber,
        data.fk_status,
        data.stateChangeDate,
        data.dispatchDate,
        new Date(),
        new Date()
      ]
    );
    next();
  } catch (err) {
    next();
  }
}
module.exports = {
  async simBulkUpload(req, res) {
    try {
      if (!req.files || (req.files && !req.files.file)) return res.send({ status: 400, message: 'failure', reason: 'File Missing' });
      if (!req.body.uid) return res.send({ status: 400, message: 'failure', reason: 'Missing uid value' });
      if (!req.body.clientID) return res.send({ status: 400, message: 'failure', reason: 'Missing clientID' });

      const sampleFile = req.files.file;
      const fileName = Date.now() + "_" + crypto.randomBytes(8).toString("hex") + "_" + sampleFile.name;
      const filePath = './uploads/' + fileName;
      await sampleFile.mv(filePath);
      const { rows, errors } = await readXlsxFile(filePath, { schema: simCreate });
      if (errors && errors.length >= 1) return res.send({ status: 400, message: 'failure', reason: 'Detials incorrect or missing' });

      const allVinDetails = await fetchVinDetails(
        rows.map(t => t.vinMsnNumber.toString()).filter((x, i, a) => a.indexOf(x) === i), req.body.uid, req.body.clientID);

      if (allVinDetails) {
        const allStatus = await executeQuery("SELECT * from status;");
        const allOem = await executeQuery("SELECT * from oem;");
        const allProviders = await executeQuery("SELECT * from networkProvider;");
        let currentRow = {};
        let series = [];
        for (i = 0; i <= rows.length - 1; i++) {
          currentRow = rows[i];

          let statusIndex = _.findIndex(allStatus, { name: currentRow.fk_status });
          currentRow.fk_status = allStatus[statusIndex].id;

          let oemIndex = _.findIndex(allOem, { name: currentRow.fk_oem })
          if (oemIndex === -1) return res.send({ status: 400, message: 'failure', reason: 'Invalid customer name in the file' });
          currentRow.fk_oem = allOem[oemIndex].id;

          let providerIndex = _.findIndex(allProviders, { name: currentRow.fk_networkProviderId });
          if (providerIndex === -1) return res.send({ status: 400, message: 'failure', reason: 'Invalid service provider in the file' });
          currentRow.fk_networkProviderId = allProviders[providerIndex].id;

          series.push(next => {
            insertIntoSimTable(currentRow, next);
          });
        }
        async.series(series, async function (err) {
          if (err) {
            return res.status(400).send({ status: 400, message: 'failure', reason: "something went wrong while upload", result: { error: err.message } });
          }
          return res.status(200).send({ status: 200, message: 'success', result: 'File uploaded successfully' });
        });
      } else return res.status(400).send({ status: 400, reason: 'something went wrong', message: 'failure', reason: 'Invalid VIN number(s)' });
    } catch (err) {
      return res.status(400).send({ status: 400, message: 'failure', reason: 'something went wrong', error: err.message });
    }
  }
};
