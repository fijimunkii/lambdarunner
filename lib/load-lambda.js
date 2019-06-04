const env = require('./env');
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({
  region: env.get('aws-region') || 'us-east-1'
});
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const os = require('os');
const path = require('path');
const https = require('https');
const unzipper = require('unzipper');
const mkdirp = Promise.promisify(require('mkdirp'));
const lockFile = Promise.promisifyAll(require('lockfile'));

module.exports = async (FunctionName, Qualifier) => {

  const dir = path.join(env.get('DATA_DIR')||os.tmpdir(),FunctionName,Qualifier);
  const lock = path.join(dir,'lock');

  let doesNotExist;
  await fs.accessAsync(dir, fs.constants.F_OK)
    .catch(() => doesNotExist = true);

  if (doesNotExist) {
    await mkdirp(dir);
    await lockFile.lockAsync(lock);
    const lambdaFn = await lambda.getFunction({ FunctionName, Qualifier }).promise();
    await new Promise((resolve, reject) => {
      https.get(lambdaFn.Code.Location, res => {
        res
          .pipe(unzipper.Extract({ path: dir }))
          .on('log', console.log)
          .on('error', reject)
          .on('finish', resolve)});
      });
    await fs.symlinkAsync(path.join(__dirname,'../node_modules/aws-sdk'), path.join(dir,'node_modules/aws-sdk'));
    await lockFile.unlockAsync(lock);
  }

  if (!doesNotExist) {
    let isLocked = await lockFile.checkAsync(lock);
    while (isLocked) { isLocked = await lockFile.checkAsync(lock); }
  }

  return dir;
};
