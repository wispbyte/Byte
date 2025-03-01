/**
 * @param {string} time String of the time to parse, supports seconds, minutes, hours, days and years
 * @returns {number} Parsed time in seconds
 */
module.exports.parseTime = (time) => {
	if (!time) return null;
	if (time === '0') return 0;
	let sections = time.split(' ');
	let returntime = 0;
	sections = sections.map(t => {
		let anothert = t.split('');
		let num = '';
		anothert.map(char => /\d/.test(char) ? num += char : null);
		let e = '';
		anothert.map(char => !/\d/.test(char) ? e += char : null);
		if (['s', 'sec', 'second', 'seconds'].includes(e)) { returntime = +Number(num); }
		else if (['m', 'min', 'minute', 'minutes'].includes(e)) { returntime = +Number(num) * 60; }
		else if (['h', 'hr', 'hour', 'hours'].includes(e)) { returntime = +Number(num) * 3600; }
		else if (['d', 'day', 'days'].includes(e)) { returntime = +Number(num) * 86400; }
		else if (['y', 'yr', 'year', 'years'].includes(e)) { returntime = +Number(num) * 31536000; }
		else {
			return 'errNoTimeSpecified';
		}
		return null;
	}).filter(r => typeof r == 'string');
	if (sections.length > 0) return null;
	return returntime;
};
