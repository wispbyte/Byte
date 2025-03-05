const mySql = require('mysql2/promise');
require('#log');

const pool = mySql.createPool({
	host: process.env.dbhost,
	user: process.env.dbuser,
	password: process.env.dbpassword,
	database: process.env.dbschema,
});

process.once('SIGINT', async () => {
	await pool.end();
	process.exit();
});

/**
 * Runs a raw SQL query in the database and returns its results.
 *
 * Example:
 *
 * ```javascript
 * const db = require("#database");
 *
 * const moderationId = 1; //example moderation ID.
 * const rows = db.query("SELECT * FROM moderationlog WHERE id = ?", [moderationId]);
 * ```
 * @param {string} sql SQL query string
 * @param {any} params SQL query string parameters.
 * @param {"execute" | "query"} [type] **SELECT, UPDATE, DELETE**: use `execute` since mySql will be prepared and safe for the request. Use `query` for **dynamic** and bulk **INSERT** and **UPDATE** queries.
 * @returns {Promise<mySql.QueryResult>} SQL query result in the database, in case of SELECT, it returns the rows.
 */
module.exports.query = async (sql, params, type = 'execute') => {
	const method = type === 'query' ? pool.query : pool.execute;
	// console.log(sql);

	const [results] = await method.call(pool, sql, params);
	return results;
};


/**
 * @typedef {'moderationLog' | 'lockdown'} Tables
 *
 * @typedef {'moderator'|'time'|'action'|'user'|'reason'|'expirationDate'|'duration'} ModLogColumns
 * @typedef {'channelId'|'lockdown'|'originalPermissions'} LockdownColumns
 *
 * @typedef {ModLogColumns | LockdownColumns | string} AllColumns
 *
 * @typedef {{ column: (ModLogColumns | 'id'), filter: string } | { column: ModLogColumns, filter: string }[]} ModLogFilter
 * @typedef {{ column: (LockdownColumns | 'id'), filter: string } | { column: LockdownColumns, filter: string }[]} LockdownFilter
 *
 * @typedef {string | bigint | number | boolean | object} DatabaseAcceptableValues
 */


/**
 * Get multiple rows of values from the database
 * @template {Tables} T
 * @param {T} table - The table you want to fetch from. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogFilter : T extends 'lockdown' ? LockdownFilter : { column: string, filter: string } | { column: string, filter: string }[]} [filter={}] - An object of the filters you want to apply
 * @param {T extends 'moderationLog' ? ModLogColumns | ModLogColumns[] : T extends 'lockdown' ? LockdownColumns | LockdownColumns[] : (string | string[] | "*")} [columns="*"] - The columns to fetch data from, leave blank or use '*' to select all columns
 * @param {number?} [limit]
 * @returns {Promise<Array>}
 */
module.exports.get = async (table, filter = {}, columns = '*', limit = null) => {
	let filters = Object.keys(filter).length > 0 ? ` WHERE ${serializeDbFilters(filter)}` : '';

	if (limit) {
		filters += ` LIMIT ${limit}`;
	}

	if (typeof (columns) !== 'string') {
		columns = columns.join(', ');
	}

	return await this.query(`SELECT ${columns} FROM ${table}${filters}`);
};

/**
 * Get a single row of values from the database
 * @template {Tables} T
 * @param {T} table - The table you want to fetch from. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogFilter : T extends 'lockdown' ? LockdownFilter : { column: string, filter: string } | { column: string, filter: string }[]} [filter={}] - An object of the filters you want to apply
 * @param {T extends 'moderationLog' ? ModLogColumns | ModLogColumns[] : T extends 'lockdown' ? LockdownColumns | LockdownColumns[] : (string | string[] | "*")} [columns="*"] - The columns to fetch data from, leave blank or use '*' to select all columns
 * @returns {Promise<any>}
 */
module.exports.getOne = async (table, filter, columns) => (await this.get(table, filter, columns, 1)).at(0);

/**
 * Write data to a new row
 * @template {Tables} T
 * @param {T} table - The table you want to write to. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogColumns | ModLogColumns[] : T extends 'lockdown' ? LockdownColumns | LockdownColumns[] : (string | string[])} columns
 * @param {DatabaseAcceptableValues | DatabaseAcceptableValues[]} values
 * @returns {Promise<mySql.QueryResult>}
 */
module.exports.write = async (table, columns, values) => {
	const columnString = typeof (columns) === 'string' ? columns : columns.join(', ');
	const convertedValues = serializeDbAcceptableValue(values);

	return await this.query(`INSERT INTO ${table} (${columnString}) VALUES (${convertedValues})`);
};

// /**
//  * Writes data for multiple rows
//  * @param {{table: Tables, columns: AllColumns | AllColumns[], values: string | string[]}[]} querylist
//  * @returns {Promise<any>[]}
//  */
// module.exports.writeMultiple = (querylist) => {
// 	for (let i = 0; i < querylist.length; i++) {
// 		querylist[i] = new Promise(async resolve => {
// 			queries.push([`INSERT INTO ${querylist[i].table} (${typeof querylist[i].columns === 'string' ? querylist[i].columns : querylist[i].columns.join(', ')}) VALUES (${typeof querylist[i].values === 'string' ? `"${querylist[i].values}"` : querylist[i].values.map(v => `"${v}"`).join(', ')})`, 'run', resolve]);
// 		});
// 	}
// 	runqueries();
// 	return querylist;
// };

/**
 * Update a specific value or set of values
 * @template {Tables} T
 * @param {T} table - The table you want to update to. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogColumns | ModLogColumns[] : T extends 'lockdown' ? LockdownColumns | LockdownColumns[] : (string | string[])} columns
 * @param { DatabaseAcceptableValues | DatabaseAcceptableValues[] } values
 * @param {T extends 'moderationLog' ? ModLogFilter : T extends 'lockdown' ? LockdownFilter : ({ column: string, filter: DatabaseAcceptableValues } | { column: string, filter: DatabaseAcceptableValues }[])} filter - An object of the filters you want to apply
 * @returns {Promise<any>}
 */
module.exports.update = async (table, columns, values, filter) => {
	let valuelist = '';
	if (typeof columns === 'string') {
		valuelist = `${columns} = ${serializeDbAcceptableValue(values, false)}`;
	}
	else if (Array.isArray(columns) && Array.isArray(values)) {
		valuelist = [];
		for (let i = 0; i < columns.length; i++) {
			valuelist.push(`${columns[i]} = ${serializeDbAcceptableValue(values[i], false)}`);
		}
		valuelist = valuelist.join(', ');
	}

	const filters = ` WHERE ${serializeDbFilters(filter)}`;

	return await this.query(`UPDATE ${table} SET ${valuelist}${filters}`);
};


/**
 * Delete a row or multiple rows
 * @template {Tables} T
 * @param {T} table - The table you want to delete from. If the autocomplete for tables is not up to date then please let bob know
 * @param {T extends 'moderationLog' ? ModLogFilter : T extends 'lockdown' ? LockdownFilter : { column: string, filter: string } | { column: string, filter: string }[]} filter - An object of the filters you want to apply
 * @returns {Promise<mySql.QueryResult>}
 */
module.exports.delete = async (table, filter) => {
	const filters = Object.keys(filter).length > 0 ? ` WHERE ${serializeDbFilters(filter)}` : '';

	return await this.query(`DELETE FROM ${table}${filters}`);
};


/**
 *
 * @param {DatabaseAcceptableValues | DatabaseAcceptableValues[]} value
 * @param {boolean} [parseArray] Whether to serialize a potential `DatabaseAcceptableValues` array object, if `false`, it'll run `JSON.stringify` on it.
 * @returns {string}
 */
function serializeDbAcceptableValue(value, parseArray = true) {
	let serialized;
	switch (typeof (value)) {
	case 'string':
		serialized = `"${value}"`;
		break;
	case 'bigint': // no breaking statement so it does what number case does.
	case 'number':
		serialized = value;
		break;
	case 'boolean':
		serialized = `${value ? 1 : 0}`; // tinyint type, is either 0 (false) or 1 (true).
		break;
	case 'object':
		if (Array.isArray(value) && parseArray) {
			serialized = value.map(v => serializeDbAcceptableValue(v, false)).join(', ');
			break;
		}

		serialized = `'${JSON.stringify(value)}'`; // using single quotes for JSON to prevent the JSON keys causing issues.
		break;
	default: throw new Error('Unexpected values type received: ' + typeof (value) + '. Expected either string, bigint, number, boolean or object.');
	}

	return serialized;
}

/**
 *
 * @param { {column: string, filter: DatabaseAcceptableValues} | {column: string, filter: DatabaseAcceptableValues}[] } filters
 * @returns {string}
 */
function serializeDbFilters(filters) {
	let serialized;
	if (Array.isArray(filters)) {
		serialized = filters.map(f => `${f.column} = ${serializeDbAcceptableValue(f.filter, false)}`).join(' AND ');
	}
	else {
		serialized = `${filters.column} = ${serializeDbAcceptableValue(filters.filter, false)}`;
	}

	return serialized;
}