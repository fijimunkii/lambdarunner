process.setMaxListeners(0);

const env = require('./lib/env');
const { sendData, receiveData, problemData, listData } = require('./lib/instances');
const os = require('os');
const Promise = require('bluebird');

const express = require('express');
const app = express();
app.use(require('body-parser').json());
app.use(require('hpp')());

if (env.get('ORCHESTRATOR')) {
  app.use('/', require('./orchestrator'));
  app.use('/instance-data', receiveData);
  app.use('/instance-problem', problemData);
  app.use('/instance-list', listData);
} else {
  app.use('/', require('./lambdarunner'));
  (function sendDataLoop() {
    Promise.delay(1000*15).then(() => sendData()).then(sendDataLoop);
  })();
}

const port = env.get('PORT')||5555;
app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
