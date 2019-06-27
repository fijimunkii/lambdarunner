const os = require('os');
const http = require('http');
const querystring = require('querystring');
const env = require('./env');
const orchestratorIp = env.get('ORCHESTRATOR_IP');
const LAMBDAS_PER_CPU = env.get('LAMBDAS_PER_CPU') || 5;
const rawData = {}; // use redis if orchestrator needs to scale

module.exports = {
  rawData, // view data for debugging
  echoData, // view data for debugging
  sendData,
  receiveData,
  problemData,
  cycle,
};

// receive new data
function receiveData(req, res, end) {
  // TODO validate all input
  const input = {};
  ['cpus','mem','complete'].forEach(d => {
    input[d] = (req.query&&req.query[d]) || (req.body&&req.body[d]);
  });
  const ip = String(req.ip || req.connection.remoteAddress).replace(/^::ffff:/,'');

  if (input.complete) {
    rawData[ip].count--;
  } else {
    rawData[ip] = { ip, time: Date.now(), cpus: input.cpus, mem: input.mem, count: 0 };
  }

  const output = 'OK';
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(output),
    'Content-Type': 'text/plain'
  });
  res.end(output);
}

// send data
async function sendData() {
  const data = querystring.stringify({
    cpus: os.cpus().length,
    mem: os.totalmem()
  });

  await new Promise((resolve,reject) => {
    http.get(`http://${orchestratorIp}/instance-data?${data}`, res => {
      res.on('end', resolve);
    })
    .on('error', reject);
  });
}

// choose the instance to use
let i = 0;
function cycle(index) {
  // restrict full instances
  const data = Object.keys(rawData).map(d => rawData[d])
    .filter(d => d.cpus * LAMBDAS_PER_CPU > d.count);
  // request can try to use an instance if not already at capacity
  if (index) {
    const instance = data.filter(d => d.ip === index)[0];
    if (!instance) {
      return cycle();
    }
    return instance.ip;
  }
  if (!data.length) throw 'NO_AVAILABLE_INSTANCES';
  // round robin
  i++;
  if (i > data.length-1) {
    i = 0;
  }
  data[i].count++;
  return data[i].ip;
}

// handle instance problem (remove from list)
// TODO: add ping / remove if havent heard from
function problemData(index) {
  const instance = rawData[index];
  if (instance) {
    instance.issues++;
    if (instance.issues > 3) {
      delete rawData[index];
    }
  }
}

// print out data
function echoData(req,res,next) {
  const output = JSON.stringify(rawData, null, '\n');
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(output),
    'Content-Type': 'text/plain'
  });
  res.end(output);
}
