exports.handler = (event, context, callback) => (async() => {
	//context.succeed('hello world');
  return 'OK';
})().then(r => callback(null, r)).catch(e => callback(e));
