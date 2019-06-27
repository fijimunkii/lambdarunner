process.setMaxListeners(0);

const env = require('./lib/env');
const { sendData, receiveData, problemData, echoData } = require('./lib/instances');
const os = require('os');
const Promise = require('bluebird');

const express = require('express');
let app = express();
app.use(require('body-parser').json());
app.use(require('hpp')());

if (env.get('ORCHESTRATOR')) {
  app.use('/run', require('./orchestrator'));
  app.use('/instance-data', receiveData);
  app.use('/instance-problem', problemData);
  app.use('/instance-echo', echoData);
} else {
  app.use('/run', require('./lambdarunner'));
  (function sendDataLoop() {
    Promise.resolve().then(() => sendData()).delay(1000*15).then(sendDataLoop);
  })();
}

app.use('/ready', (req,res,next) => {
  const output = 'OK';
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(output),
    'Content-Type': 'text/plain'
  });
  res.end(output);
});

app = require('http').createServer(app);

const port = env.get('PORT')||5555;
app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
