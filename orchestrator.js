const handleError = require('./lib/handle-error');
const cycleInstances = require('./lib/instances').cycle;

module.exports = (req, res) =>  {
  return orchestrator(req,res)
    .catch(err => handleError(err,req,res));
};

async function orchestrator(req, res) {
  // get ip address
  const ip = await cycleInstances();

  // TODO: chained failover

  // Layer 7 Content Switching aka URL rewriting
  // relay req to IP (include all input data??)
  // 307 is supposed to resend the data
  res.writeHead(307, { Location: `http://${ip}:5555?${req.query}` });
  res.end();
}
