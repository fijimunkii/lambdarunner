const os = require('os');
const http = require('http');
const querystring = require('querystring');
const env = require('./env');
const orchestratorIp = env.get('orchestrator-ip');
const data = new Map();

module.exports = {
  data,
  sendData,
  receiveData,
  problemData,
  cycle,
};

// receive new data
function receiveData(req, res, end) {
  // validate all input
  const input = {};
  ['cpu','mem'].forEach(d => {
    input[d] = (req.query&&req.query[d]) || (req.body&&req.body[d]);
    if (!input[d])
      throw `Missing required parameter: ${d}`;
  });

  // store instance data
  const ip = req.ip || req.connection.remoteAddress;
  ips.set(ip, { time: Date.now(), cpu: input.cpu, mem: input.mem });

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
    cpu: os.loadavg()[0] / os.cpus().length * 100,
    mem: os.freemem() / os.totalmem() * 100
  });

  await new Promise((resolve,reject) => {
    http.get(`http://${orchestratorIp}/phone-home?${data}`, res => {
      res.on('end', resolve);
    })
    .on('error', reject);
  });
}

// sort by cpu usage
function sorted() {
  return Array.from(data).sort((a,b) => a.cpu - b.cpu);
}

// round robin the sorted array
let i = 0;
function cycle(index) {
  if (index === undefined) {
    i++;
    if (i > count-1) {
      i = 0;
    }
    index = i;
  } else if (index < 1) {
    index = index * 100;
  }
  index = Math.floor(index) % count;
  const data = sorted();
  return data[index].ip;
}

// handle instance problem (remove from list)
function problemData(index) {
  if (data.has(index)) {
    const instance = data.get(index);
    if (instance.issues) instance.issues++;
    else instance.issues = 1;
    if (instance.issues > 3) {
      data.delete(index);
    } else {
      data.set(index, instance);
    }
  }
}

// print out data
function listData() {
  const output = JSON.stringify(data, null, '\n');
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(output),
    'Content-Type': 'text/plain'
  });
  res.end(output);
}
