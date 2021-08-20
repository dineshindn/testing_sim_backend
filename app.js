const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const json2xls = require('json2xls');
const path = require('path');
const app = express();
require('dotenv').config()

// Allow files in public folder
app.use('/api/v1/static', express.static(path.join(__dirname, 'public')));

// globally available logger
global.log = require('./logger');

// configuring cors
var corsOptions = {
  // origin: "http://localhost:8081"
};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// file upload
app.use(fileUpload());
// Request logger
app.use(morgan('dev'));
// JSON to Excel converter
app.use(json2xls.middleware);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to backends1" });
});

// Require our routes into the application.
require('./routes')(app);

// set port, listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
