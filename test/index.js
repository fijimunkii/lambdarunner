const orchestratorEnv = {
  PORT: 5555,
  ORCHESTRATOR: true
};
const runnerEnv = {
  PORT: 7777,
  ORCHESTRATOR_IP: `localhost:${orchestratorEnv.PORT}`,
  AWS_ENDPOINT: 'http://localhost:4569',
};
const dir = require('path').join(__dirname,'../');
const { fork } = require('child_process');
const waitOn = require('wait-on');
const http = require('http');
const querystring = require('querystring');
const runQuerystring = querystring.stringify({
  functionName: 'test',
  qualifier: '$LATEST',
  config: JSON.stringify({}),
  context: JSON.stringify({})
});

module.exports = async t => {
  const orchestrator = fork('index', { cwd: dir, env: orchestratorEnv });
  await waitOn({resources:[`http://localhost:${orchestratorEnv.PORT}/ready`]});
  const runner = fork('index', { cwd: dir, env: runnerEnv });
  await waitOn({resources:[`http://localhost:${runnerEnv.PORT}/ready`]});

  try {

    t.test('runner', async t => {

      t.test('runs a lambda', async t => {
        await new Promise((resolve,reject) => {
          http.get(`http://localhost:${runnerEnv.PORT}/run?${runQuerystring}`, res => {
            let data = [];
            res.on('data', d => data.push(d.toString('utf8')));
            res.on('end', () => {
              const response = data.join('');
              t.same(response, 'OK');
              resolve();
            });
          })
          .on('error', reject);
        });
      });

    });

    t.test('orchestrator', async t => {
      t.test('relays request to an instance', async t => {
        await new Promise((resolve,reject) => {
          http.get(`http://localhost:${orchestratorEnv.PORT}/run?${runQuerystring}`, res => {
            res.on('end', () => {
              t.same(res.statusCode, 307);
              t.same(res.headers.Location, `http://localhost:${runnerEnv.Port}/run/${runQueryString}`);
              resolve();
            });
          })
          .on('error', reject);
        });
      }); // test 307

      t.test('instances', async t => {
        t.test('sendData');
        t.test('receiveData');
        t.test('listData');
      });
    });

    t.tearDown(() => {
      orchestrator.kill();
      runner.kill();
    });

  } catch(e) { console.log(e); }
};

if (!module.parent) module.exports(require('tap'));
