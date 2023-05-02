const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const { commonErrorHandler } = require('./utilities/errorHandler');

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(
  bodyParser.urlencoded({
    limit: '10mb',
    extended: true,
    parameterLimit: 50000
  })
);
// Enable cors support to accept cross origin requests
app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));

// Enable helmet js middleware to configure secure headers
app.use(helmet());

// Enable gzip compression module for REST API
app.use(compression());

app.use('/health', (_req, res) => {
  res.send({ message: 'Application running successfully!' });
});

// 404 Error Handling
app.use((req, res) => {
  const message = 'Invalid endpoint';
  commonErrorHandler(req, res, message, 404);
});

module.exports = app;
