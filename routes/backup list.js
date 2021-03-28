async list(req, res) {
  try {
    const { simNumber, deviceId, mobileNumber } = req && req.query ? req.query : {};
    const limit = req && req.query && req.query.limit ? req.query.limit : 10;
    const page = req && req.query && req.query.page ? req.query.page : 1;
    var offset;
    offset = (page - 1) * limit;
    offset = Number.isNaN(offset) ? 0 : offset;
    let value;
    let query;
    if (simNumber || deviceId || mobileNumber) {
      if (simNumber) {
        query = `SELECT * FROM simDetails WHERE simNumber REGEXP ${simNumber} limit ${limit} offset ${offset};`;
        value = simNumber;
      } else if (deviceId) {
        query = `SELECT * FROM simDetails WHERE deviceId REGEXP ${deviceId} limit ${limit} offset ${offset};`;
        value = deviceId;
      } else if (mobileNumber) {
        query = `SELECT * FROM simDetails WHERE mobileNumber REGEXP ${mobileNumber} limit ${limit} offset ${offset};`;
        value = mobileNumber;
      }
    } else {
      query = `SELECT * FROM simDetails limit ${limit} offset ${offset};`;
    }
    const result = await executeQuery(query, [value]);
    const totalRecords = await executeQuery(`SELECT COUNT(*) FROM simDetails;`);
    const responseJson = {
      'totalCount': parseInt(Object.values(totalRecords[0]).join(",")),
      'pageCount': result.length,
      'pageNumber': page,
      'data': result
    }
    return res.send({ status: 200, message: 'success', result: responseJson });
  } catch (err) {
    return res.send({ status: 400, message: 'failure', result: { error: err.message } });
  }
},