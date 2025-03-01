/*
This file will try to explain how to use the database with examples

In these functions I have put in autocomplete for vscode for the tables and columns where possible, these are all manually added
though so if any are ever missing then please do notify Bob.

Do note that all values with the exception of empty cells are always strings.

Where it says that for an argument you can pass in a value or an array of that value, you can still pass in an array of one value
and it will work the same.

*/

// First you'd need to import it into the file, you can name it db or database or anything but keep it consistent throughout the file.
// For convinience you can import the database using #database no matter where you are in the project
const db = require('#database');

/*

Any time a filter is mentioned this is what it is (unless specificed otherwise)

A filter is an argument that you can pass into a function which will select/delete/update a row or set of rows that fits the filter.
It is an optional argument in all of the functions however some unwanted behaviour can arise if filters are not used, for example
you can delete all data in a table if using the delete function and not have any filter.
The filter is an object with a column and filter value. For now the filter is only able to search for exact matches.
The column value is the column to look in and the filter is the value to look for.
The filter can be passed as just an object or an array of filter objects so that multiple filters can be applied.

An example of just one filter that will delete all rows where the user value is '710216715971199019'
*/
db.delete('moderationLog', { column: 'user', filter: '710216715971199019' });
/*
Multiple filters would look something like this below. This should delete all rows where the duration is '3h' and the action is 'mute'
*/
db.delete('moderationLog', [ { column: 'duration', filter: '3h' }, { column: 'action', filter: 'mute' } ]);



/*

The database file exports several functions:
> raw
> get
> getOne
> write
> update
> delete

*/


/*
 -- db.raw --
This function quite simply lets you run sql queries directly if you need some little feature not in the other functions
You have the option to select what type of operation you are going to do from; run, get, all and exec.

Run would be used for insert, update, delete and other similar statements
Get would be for selecting a single row
All would be for selecting multiple rows but can also run other queries
Exec is for making changes to the database schema, eg create, drop, pragma

*/
db.raw('SELECT * FROM moderationLog WHERE moderator = "melo"', 'all');

/*
 -- db.get --
Get will fetch all values from the specified table where the filter applies.
For this funtion and all the following ones you need to pass in the table nameas the first argument.
You have the filter (read above for information) and there is an option argument of column.
This column argument will control what values are returned, by default it is '*' which is returning all columns but you can put in
either a string for one column to return or an array of strings for multiple columns to return

The values returned are in an array with each row an object
[
	{
		channelId: '1112023292333785120',
		lockdown: 'false',
		originalPermissions: '{}'
	},
	{
		channelId: '1146442479508402247',
		lockdown: 'true',
		originalPermissions: '{everyone:{sendMessages:true}}'
	},
]

This example should return all values in the lockdown table
*/
db.get('lockdown');

// Here this should return the channel id and original permissions of all channels that have the lockdown as true
db.get('lockdown', { column: 'lockdown', filter: 'true' }, ['channelId', 'originalPermissions']);

/*
 -- db.getOne --
Get one is very similar to get but will only fetch the first found row that fits the filter and will return a single object
with the selected values, everything else is exactly the same
*/

/*
 -- db.write --
Write creates a new row in a table with the specified values.
You can pass in table, columns and values.
Columns is the columns you would like to write the values to. It should be either a string for only one value or an array of
strings for multiple values.
Values is the data you are going to be writing into the row, these must be in the same order as the columns you put in (if writing multiple)
so that the values go into the correct columns. It should also be either a string or an array of strings.

This should put a new row in moderationLog with every possible value (at the time of writing)
*/
db.write('moderationLog', ['action', 'duration', 'expirationDate', 'moderator', 'reason', 'time', 'user'], [
	'mute', // action
	'3d', // duration
	'1741044508394', // expirationDate
	'788354615254974474', // moderator
	'Spam', // reason
	'1740785308394', // time
	'1078507801120350267', // user
]);

/*
 -- db.update --
Update overwrites an existing row in a table with the specified values.
You can pass in table, columns, values and a filter.
Columns is the columns you would like to write the values to. It should be either a string for only one value or an array of
strings for multiple values.
Values is the data you are going to be writing into the row, these must be in the same order as the columns you put in (if writing multiple)
so that the values go into the correct columns. It should also be either a string or an array of strings.

This should overwrite the lockdown status of a channel
*/
db.update('lockdown', 'lockdown', 'false', { column: 'channelId', filter: '1146442479508402247' });

/*
 -- db.update --
Deletes a row or multiple rows from the passed in filter.
! If no filter is passed in then the entire table will be deleted !

This would delete all rows in moderation log that are kicks
*/
db.delete('moderationLog', { column: 'action', filter: 'kick' });