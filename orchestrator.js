const handleError = require('./lib/handle-error');
const fetchIps = require('./lib/fetch-ips');

module.exports = (req, res) =>  {
  return orchestrator(req,res)
    .catch(err => handleError(err,req,res));
};

async function orchestrator(req, res) {
  // get list of weighted IPs
  const ips = await fetchIps();

  // use first IP
  // TODO: chained failover (how to do this with http redirect?)
  const ip = ips[0];

  // Layer 7 Content Switching aka URL rewriting
  // relay req to IP (include all input data??)
  // 307 is supposed to resend the data
  res.writeHead(307, { Location: `http://${ip}:5555?${req.query}` });
  res.end();
}
