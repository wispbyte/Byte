const sqlite = require('sqlite3');

const queries = [];
let running = false;

function runqueries() {
	if (running) return;
	if (queries.length === 0) throw 'Run queries function was executed but there are no queries to be executed';
	running = true;

	let queri = queries.splice(0);
	const db = new sqlite.Database('./utilities/db.sqlite');
	db.serialize(async () => {
		queri.map(q => {
			db[q[1]](q[0], (err, rows) => {
				if (err) console.error(err);
				q[2](q[1] == 'run' ? this.changes : rows);
			});
		});
	});

	db.on('close', () => running = false);
	db.close();
}

/* setInterval(() => {
	if (queries.length > 0 && running == false) { runqueries(); }
}, 20000); */




/**
 * This lets you directly run SQL queries if you need something specific
 * @param {string} query - SQL query to run
 * @param {'all'|'exec'|'get'|'run'} type - The type of query being run, if you don't know what one to use then just use 'all'
 * @returns {Promise<any>}
 */
module.exports.raw = (query, type) => {
	return new Promise(async resolve => {
		queries.push([query, type, resolve]);
		runqueries();
	});
};


/**
 * @typedef {'moderationLog' | 'lockdown'} Tables
 *
 * @typedef {'moderator'|'time'|'action'|'user'|'reason'|'expirationDate'|'duration'} ModLogColumns
 * @typedef {'channelId'|'lockdown'|'originalPermissions'} LockdownColumns
 *
 * @typedef {ModLogColumns | LockdownColumns | string} AllColumns
 *
 * @typedef {{ column: (ModLogColumns | 'rowid' | 'caseId'), filter: string } | { column: ModLogColumns, filter: string }[]} ModLogFilter
 * @typedef {{ column: (LockdownColumns | 'rowid'), filter: string } | { column: LockdownColumns, filter: string }[]} LockdownFilter
 */


/**
 * Get multiple rows of values from the database
 * @template {Tables} T
 * @param {T} table - The table you want to fetch from. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogFilter : T extends 'lockdown' ? LockdownFilter : { column: string, filter: string } | { column: string, filter: string }[]} [filter={}] - An object of the filters you want to apply
 * @param {T extends 'moderationLog' ? ModLogColumns | ModLogColumns[] : T extends 'lockdown' ? LockdownColumns | LockdownColumns[] : (string | string[] | "*")} [columns="*"] - The columns to fetch data from, leave blank or use '*' to select all columns
 * @returns {Promise<Array>}
 */
module.exports.get = (table, filter = {}, columns = '*') => {
	let filters = '';
	if (Array.isArray(filter) && filter.length > 0) {
		filters = ` WHERE ${filter.map(f => `${f.column} = "${f.filter}"`).join(' AND ')}`;
	}
	else if (filter && filter.filter && filter.column) {
		filters = ` WHERE ${filter.column} = "${filter.filter}"`;
	}

	return new Promise(async resolve => {
		queries.push([`SELECT ${columns} FROM ${table}${filters}`, 'all', resolve]);
		runqueries();
	});
};

/**
 * Get a single row of values from the database
 * @template {Tables} T
 * @param {T} table - The table you want to fetch from. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogFilter : T extends 'lockdown' ? LockdownFilter : { column: string, filter: string } | { column: string, filter: string }[]} [filter={}] - An object of the filters you want to apply
 * @param {T extends 'moderationLog' ? ModLogColumns | ModLogColumns[] : T extends 'lockdown' ? LockdownColumns | LockdownColumns[] : (string | string[] | "*")} [columns="*"] - The columns to fetch data from, leave blank or use '*' to select all columns
 * @returns {Promise<any>}
 */
module.exports.getOne = (table, filter = {}, columns = '*') => {
	let filters = '';
	if (Array.isArray(filter) && filter.length > 0) {
		filters = ` WHERE ${filter.map(f => `${f.column} = "${f.filter}"`).join(' AND ')}`;
	}
	else if (filter && filter.filter && filter.column) {
		filters = ` WHERE ${filter.column} = "${filter.filter}"`;
	}

	return new Promise(async resolve => {
		queries.push([`SELECT ${columns} FROM ${table}${filters}`, 'get', resolve]);
		runqueries();
	});
};

/**
 * Write data to a new row
 * @template {Tables} T
 * @param {T} table - The table you want to write to. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogColumns | ModLogColumns[] : T extends 'lockdown' ? LockdownColumns | LockdownColumns[] : (string | string[])} columns
 * @param {string[]} values
 * @returns {Promise<any>}
 */
module.exports.write = (table, columns, values) => {
	return new Promise(async resolve => {
		queries.push([`INSERT INTO ${table} (${typeof columns === 'string' ? columns : columns.join(', ')}) VALUES (${typeof values === 'string' ? `"${values}"` : values.map(v => `"${v}"`).join(', ')})`, 'run', resolve]);
		runqueries();
	});
};

/**
 * Writes data for multiple rows
 * @param {{table: Tables, columns: AllColumns | AllColumns[], values: string | string[]}[]} querylist
 * @returns {Promise<any>[]}
 */
module.exports.writeMultiple = (querylist) => {
	for (let i = 0; i < querylist.length; i++) {
		querylist[i] = new Promise(async resolve => {
			queries.push([`INSERT INTO ${querylist[i].table} (${typeof querylist[i].columns === 'string' ? querylist[i].columns : querylist[i].columns.join(', ')}) VALUES (${typeof querylist[i].values === 'string' ? `"${querylist[i].values}"` : querylist[i].values.map(v => `"${v}"`).join(', ')})`, 'run', resolve]);
		});
	}
	runqueries();
	return querylist;
};

/**
 * Update a specific value or set of values
 * @template {Tables} T
 * @param {T} table - The table you want to update to. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogColumns | ModLogColumns[] : T extends 'lockdown' ? LockdownColumns | LockdownColumns[] : (string | string[])} columns
 * @param {string[]} values
 * @param {T extends 'moderationLog' ? ModLogFilter : T extends 'lockdown' ? LockdownFilter : ({ column: string, filter: string } | { column: string, filter: string }[])} filter - An object of the filters you want to apply
 * @returns {Promise<any>}
 */
module.exports.update = (table, columns, values, filter) => {
	let valuelist = '';
	if (typeof columns === 'string' && typeof values === 'string') {
		valuelist = `${columns} = "${values}"`;
	}
	else if (Array.isArray(columns) && Array.isArray(values)) {
		valuelist = [];
		for (let i = 0; i < columns.length; i++) {
			valuelist.push(`${columns[i]} = "${values[i]}"`);
		}
		valuelist = valuelist.join(', ');
	}

	let filters = '';
	if (Array.isArray(filter) && filter.length > 0) {
		filters = ` WHERE ${filter.map(f => `${f.column} = "${f.filter}"`).join(' AND ')}`;
	}
	else if (filter && filter.filter && filter.column) {
		filters = ` WHERE ${filter.column} = "${filter.filter}"`;
	}

	return new Promise(async resolve => {
		queries.push([`UPDATE ${table} SET ${valuelist}${filters}`, 'run', resolve]);
		runqueries();
	});
};


/**
 * Delete a row or multiple rows
 * @template {Tables} T
 * @param {T} table - The table you want to delete from. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogFilter : T extends 'lockdown' ? LockdownFilter : { column: string, filter: string } | { column: string, filter: string }[]} filter - An object of the filters you want to apply
 * @returns {Promise<any>}
 */
module.exports.delete = (table, filter) => {
	let filters = '';
	if (Array.isArray(filter) && filter.length > 0) {
		filters = ` WHERE ${filter.map(f => `${f.column} = "${f.filter}"`).join(' AND ')}`;
	}
	else if (filter && filter.filter && filter.column) {
		filters = ` WHERE ${filter.column} = "${filter.filter}"`;
	}


	return new Promise(async resolve => {
		queries.push([`DELETE FROM ${table}${filters}`, 'run', resolve]);
		runqueries();
	});
};
