const log = {
	log: console.log,
};

console.log = (message, level) => {
	if (process.argv.includes('-q') || process.argv.includes('--quiet')) {
		if (level === 'v') return;
		log.log(message);
	}
	else {
		log.log(message);
	}
};