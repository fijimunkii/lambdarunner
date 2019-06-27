const handleError = require('./lib/handle-error');
const loadLambda = require('./lib/load-lambda');
const env = require('./lib/env');
const orchestratorIp = env.get('ORCHESTRATOR_IP');
const promisify = require('util').promisify;
const querystring = require('querystring');
const http = require('http');

module.exports = (req, res) => {
  return lambdarunner(req,res)
    .catch(err => handleError(err,req,res));
};

async function lambdarunner(req, res) {
  // validate all input
  const input = {};
  ['functionName','qualifier','config','context'].forEach(d => {
    input[d] = (req.query&&req.query[d]) || (req.body&&req.body[d]);
    if (!input[d]) {
      console.log(req.originalUrl);
      throw `Missing required parameter: ${d}`;
    }
  });
  ['config','context'].forEach(d => {
    if (typeof input[d] === 'string') {
      try {
        input[d] = JSON.parse(input[d]);
      } catch(e) { throw `Invalid JSON in parameter: ${d}`; }
    }
  });

  // run lambda
  const lambdaDir = await loadLambda(input.functionName, input.qualifier);
  const lambdaFn = promisify(require(lambdaDir).handler);
  let output = await lambdaFn(input.config, input.context);
  if (typeof output === 'object') {
    output = JSON.stringify(output);
  }
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(output),
    'Content-Type': 'text/plain'
  });
  res.end(output);

  // send complete event
  const data = querystring.stringify({ complete: true /* TODO inclue ref */ });
  await new Promise((resolve,reject) => {
    http.get(`http://${orchestratorIp}/instance-data?${data}`, res => {
      res.on('end', resolve);
    })
    .on('error', reject);
  });

};
