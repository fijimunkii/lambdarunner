const handleError = require('./lib/handle-error');
const fetchIps = require('./lib/fetch-ips');

module.exports = (req, res) =>  {
  return orchestrator(req,res)
    .catch(err => handleError(err,req,res));
};

async function orchestrator(req, res) {
  // get IPs with weighting
  const ips = await fetchIps();

  // determine IP to use
  const ip = ips[0];

  // relay req to IP (include all input data??)
  // 307 is supposed to resend the data
  res.writeHead(307, { Location: `http://${ip}:5555?${req.query}` });
}
