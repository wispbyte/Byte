const log = {
	log: console.log,
	warn: console.warn
};

console.log = (...args) => {
	const lastArg = args[args.length - 1];
	const quiet = (process.argv.includes('-q') || process.argv.includes('--quiet'));
	if (lastArg === "v"){
		if (quiet) return;
		args.pop(); //remove the last arg so it doesn't log.
	}
	
	log.log(...args);
};

/**
 * @type { {text: string; time: DOMHighResTimeStamp}[] }
 */
const stopWatches = [];
/**
 * 
 * @param {string} format Format, and use %t where to insert the time once you make it stop. If `%t` isn't provided, it'll add the time at the end.
 * @return {number} stop watch id
 */
console.stopwatch = (format) => {
	return stopWatches.push({ time: performance.now(), text: format }) - 1;
}

console.stopwatchEnd = (id) => {
	const data = stopWatches.at(id);
	if (!data){
		console.log("No stopwatch with id", id);
		return;
	}
	stopWatches.splice(id, 1);
	const timeElapsedExact = performance.now() - data.time;
	const timeElapsed = timeElapsedExact >= 1000 ? `${(timeElapsedExact * 1000).toFixed(3)}s` : `${timeElapsedExact.toFixed(3)}ms`;

	if (data.text.includes("%t")){
		data.text = data.text.replace("%t", timeElapsed);
	} else {
		data.text += ` ${timeElapsed}`;
	}

	console.log(data.text);
}