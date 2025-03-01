const log = {
	log: console.log,
};

console.log = (...args) => {
	if ((process.argv.includes('-q') || process.argv.includes('--quiet')) && args.slice(-1)[0] === 'v') return;
	else log.log(...args);
};