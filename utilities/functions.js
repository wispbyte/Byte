const db = require('#database');
const { EmbedBuilder } = require('discord.js');
const { GuildChannel, Guild, PermissionFlagsBits, ChannelType, ChatInputCommandInteraction } = require('discord.js');

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
		if (['s', 'sec', 'second', 'seconds'].includes(e)) { returntime += Number(num); }
		else if (['m', 'min', 'minute', 'minutes'].includes(e)) { returntime += Number(num) * 60; }
		else if (['h', 'hr', 'hour', 'hours'].includes(e)) { returntime += Number(num) * 3600; }
		else if (['d', 'day', 'days'].includes(e)) { returntime += Number(num) * 86400; }
		else if (['y', 'yr', 'year', 'years'].includes(e)) { returntime += Number(num) * 31536000; }
		else {
			return 'errNoTimeSpecified';
		}
		return null;
	}).filter(r => typeof r === 'string');
	if (sections.length > 0) return null;
	return returntime;
};

/**
 * Formats a time provided in milliseconds, using an optional format.
 * @param {number} time Time in milliseconds
 * @param {string} format Format, use %h for hours, %m for minutes, %s for seconds and %ms for milliseconds.
 */
module.exports.formatTime = (time, format) => {
	const millis = Math.floor(time % 1000);
	const seconds = Math.floor((time / 1000) % 60);
	const minutes = Math.floor((time / (60 * 1000)) % 60);
	const hours = Math.floor((time / (60 * 60 * 1000)) % 24);
	const days = Math.floor(time / (60 * 60 * 24 * 1000));

	return format.replaceAll('%d', days).replaceAll('%h', hours).replaceAll('%m', minutes).replaceAll('%s', seconds).replaceAll('%ms', millis);
};

/**
 *
 * @param { Date | number } time A *`date` object* or *seconds since January 1st, 1970* that represents the time.
 * @param {"t" | "T" | "d" | "D" | "f" | "F" | "R"} type How the timestamp should be displayed on Discord.
 * - **t**: Short Time (ex: *10:00 AM*)
 * - **T**: Long Time (ex: *10:00:00 AM*)
 * - **d**: Short date (ex: *03/03/2025*)
 * - **D**: Long date (ex: *March 3, 2025*)
 * - **f**: Short date and time (ex: *March 3, 2025 10:00 AM*)
 * - **F**: Long date and time (ex: *Monday, March 3, 2025 10:00 AM*)
 * - **R**: Relative (ex: *21 minutes ago*).
 * @returns {`<t:${time}:${type}>`} The formatted time, looking like this: `<t:${time}:${type}`>
 */
module.exports.formatDiscordTime = (time, type) => {
	if (typeof (time) === 'number') {
		return `<t:${time}:${type}>`;
	}

	return `<t:${time.getTime() / 1000}:${type}>`;
};


class ChannelLocking {
	/**
     * **SendMessages**: **In case of a forum channel**, whether everyone can create posts or not.
     *
     * **CreatePublicThreads**: Whether everyone could originally create public threads in that channel.
     *
     * **CreatePrivateThreads**: Whether everyone could originally create private threads in that channel.
     *
     * **Connect**: **In case of a voice channel**, whether everyone can connect or not.
     *
     * **SendMessagesInThreads**: Whether everyone could originally send messages in threads (or posts in case of forum channel).
     * @typedef { { SendMessages: boolean, CreatePublicThreads: boolean, CreatePrivateThreads: boolean, Connect: boolean, SendMessagesInThreads: boolean } } LockdownChannelPermissions
     */

	/**
     * **lockdown**: Whether the channel was locked for lockdown reasons
     *
     * **channelId**: the channel id
     *
     * **originalPermissions**: the original everyone role permissions in that channel before being locked.
     * @typedef { { lockdown: boolean; channelId: string; originalPermissions: LockdownChannelPermissions } } LockedChannel
     */

	/**
     * @typedef { { lockdown: number; channelId: string; originalPermissions: string; } } DbLockedChannel
     */

	/**
     *
     * @param {import("discord.js").GuildChannel } channel
     * @param {boolean} lockdown Whether it's server lockdown or just channel being locked
     * @param {string?} reason Custom channel locking reason. Default for **lockdown = `true`**: *Lockdown command*
     */
	static async lockChannel(channel, lockdown, reason) {
		const everyone = channel.guild.roles.everyone;
		const channelPermissions = channel.permissionsFor(everyone);

		if (!channelPermissions.has(PermissionFlagsBits.SendMessages)) {
			// channel is already locked
			throw new Error('Channel not publicly writable, or is already locked.');
		}

		// Gets all permissions, to then only keep the specific ones that are enabled for everyone.
		/**
         * @type {LockdownChannelPermissions}
         */
		const originalPermissions = {
			Connect: channel.isVoiceBased() ? channelPermissions.has('Connect') : null,
			CreatePrivateThreads: channelPermissions.has('CreatePrivateThreads'),
			CreatePublicThreads: channelPermissions.has('CreatePublicThreads'),
			SendMessages: channel.type === ChannelType.GuildForum ? channelPermissions.has('SendMessages') : null,
			SendMessagesInThreads: channelPermissions.has('SendMessagesInThreads'),
		};

		/**
         * @type {import("discord.js").GuildChannelOverwriteOptions}
         */
		const options = { reason: reason === null ? (lockdown ? 'Lockdown command' : 'Lock command') : reason };
		const locked = !!await ChannelLocking.getAndReviveLockedChannelData(channel.id);
		if (locked && !lockdown) {
			throw new Error('Channel is already locked.');
		}

		await channel.permissionOverwrites.edit(everyone, {
			SendMessages: false,
			CreatePublicThreads: false,
			CreatePrivateThreads: false,
			SendMessagesInThreads: false,
			Connect: channel.isVoiceBased() ? false : undefined,
		}, options).then(() => {
			// Marking the channel as locked after attempting to lock it in case of error.
			if (!locked) { // if it wasn't already locked
				db.write('lockdown', ['channelId', 'lockdown', 'originalPermissions'], [ channel.id, lockdown, originalPermissions ]);
			}
			else {
				db.update('lockdown', 'lockdown', lockdown, { column: 'channelId', filter: channel.id });
			}
		}, (error) => {
			throw new Error(error);
		});

		for (const modRole of channel.client.config.modRoles) {
			setTimeout(() => {
				channel.permissionOverwrites.edit(modRole, {
					SendMessages: true,
					SendMessagesInThreads: channelPermissions.has('SendMessagesInThreads'),
				}).catch(error => {
					console.error(`Couldn't create permission overwrite for moderator role ${modRole}:`, error);
				});
			}, Math.random() * 1000 * 8.5); // random delay to not spam Discord's APIs.
		}
	}

	/**
     * Unlocks a channel, even if it's not registered as locked (in this case, it will only enable message permission).
     * @param {GuildChannel} channel The channel to unlock
     * @param {LockedChannel?} lockData The locked channel data from the database. If `null`, a request to the database will be done.
     * @param {string?} reason The unlock channel reason, defaults to *Unlock command*.
	 * @param {boolean?} careAboutLockdown If `true`, it won't unlock the channel if the channel has been locked due to lockdown, otherwise `false` and let it overwrite and unlock channel.
     */
	static async unlockChannel(channel, lockData, reason, careAboutLockdown) {
		const everyone = channel.guild.roles.everyone;
		const everyonePermissions = channel.permissionsFor(everyone);
		if (everyonePermissions.has(PermissionFlagsBits.SendMessages)) {
			throw new Error('Channel is already unlocked.');
		}

		/**
         * @type {import("discord.js").GuildChannelOverwriteOptions}
         */
		const options = { reason: reason ?? 'Unlock command' };

		lockData = lockData || await ChannelLocking.getAndReviveLockedChannelData(channel.id);
		if (lockData?.lockdown && careAboutLockdown) {
			return; // don't unlock channel
		}

		/**
		 * @type {import("discord.js").PermissionOverwriteOptions}
		 */
		const unlockingData = lockData !== null ? {
			SendMessages: channel.type === ChannelType.GuildForum ? lockData.originalPermissions.SendMessages : true,
			CreatePublicThreads: lockData.originalPermissions.CreatePublicThreads,
			CreatePrivateThreads: lockData.originalPermissions.CreatePrivateThreads,
			SendMessagesInThreads: lockData.originalPermissions.SendMessagesInThreads,
			Connect: channel.isVoiceBased() ? lockData.originalPermissions.Connect : undefined,
		} : { SendMessages: true, Connect: channel.isVoiceBased() ? true : undefined, SendMessagesInThreads: channel.type === ChannelType.GuildForum ? true : undefined };

		await channel.permissionOverwrites.edit(everyone, unlockingData, options).then(async () => {
			if (lockData) {
				db.delete('lockdown', { column: 'channelId', filter: channel.id })
					.catch((error) => console.error('Couldn\'t delete', channel.id, 'row:', error));
			}
		}, (error) => {
			throw error;
		});
	}

	/**
     * Gets channels that can be affected by the `lockdown start` command.
     * @param {Guild} guild
     */
	static getLockdownableChannels(guild) {
		const channels = [];
		for (const [_, channel] of guild.channels.cache) {
			if (channel.isDMBased() || channel.type === ChannelType.GuildCategory || channel.type === ChannelType.GuildDirectory || !channel.permissionsFor(channel.guild.roles.everyone).has(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages)) {continue;} // Not public viewable and / or writable channel

			channels.push(channel);
		}

		return channels;
	}

	/**
     *
     * @param {string} channelId
     * @returns {Promise<LockedChannel?>}
     */
	static async getAndReviveLockedChannelData(channelId) {
		const dbData = await db.getOne('lockdown', { column: 'channelId', filter: channelId });

		return ChannelLocking.reviveLockedChannelData(dbData);
	}

	/**
     *
     * @param { { channelId: string, lockdown: string, originalPermissions: LockdownChannelPermissions } } data
     * @returns {LockedChannel?}
     */
	static reviveLockedChannelData(data) {
		if (!data) { return null; } // not found

		return {
			channelId: data.channelId,
			lockdown: data.lockdown === 1,
			originalPermissions: typeof (data.originalPermissions) === 'string' ? JSON.parse(data.originalPermissions) : data.originalPermissions, //
		};
	}

	static async isAnyChannelUnderLockdown() {
		const isUnderLockdown = await db.getOne('lockdown', { column: 'lockdown', filter: true });
		return !!isUnderLockdown;
	}

	/**
	 * Enters the server into lockdown
	 * @param {Guild} guild The guild object.
	 * @param {number?} duration Optional duration for the lockdown, should be at least 5 minutes.
	 * @param {ChatInputCommandInteraction?} interaction An optional (deferred) interaction object to keep updated with the lockdown status. Note that invalid input errors won't be displayed on the reply message.
	 */
	static async enterLockdown(guild, duration, interaction) {
		if (duration && duration < 60 * 5) {
			throw new Error('Server cannot be on lockdown for less than 5 minutes.');
		}
		else if (await ChannelLocking.isAnyChannelUnderLockdown()) {
			throw new Error('Server is already under lockdown.');
		}

		const channelsToLock = ChannelLocking.getLockdownableChannels(guild);
		await interaction?.editReply({ embeds: [
			new EmbedBuilder()
				.setDescription(`Locking down ${channelsToLock.length} channels...`)
				.setColor('DarkBlue'),
		] });

		const channelLockingFails = []; // Only for the interaction
		let lockedChannelsCount = 0; // Also only for the interaction
		for (const channel of channelsToLock) {
			await ChannelLocking.lockChannel(channel, true, interaction ? 'Lockdown start command' : 'Lockdown')
				.then(() => {
					lockedChannelsCount += 1;
				}, (error) => {
					channelLockingFails.push(`<#${channel.id}>: ${error}`);
				});
		}

		if (duration) {
			const started = Date.now();
			setTimeout(async () => {
				if (!await ChannelLocking.isAnyChannelUnderLockdown()) return; // server has been unlocked before.
				await ChannelLocking.exitLockdown(guild).finally(async () => await interaction.channel?.send({
					embeds: [new EmbedBuilder()
						.setTitle('Lockdown ended')
						.setDescription(`Server lockdown ended automatically, it started ${module.exports.formatDiscordTime(started, 'R')}.`)
						.setColor('DarkBlue'),
					],
				}));
			}, duration * 1000);
		}

		return { lockedChannels: lockedChannelsCount, totalChannels: channelsToLock.length, fails: channelLockingFails };
	}

	/**
	 *
	 * @param {Guild} guild
	 * @param {ChatInputCommandInteraction?} interaction
	 */
	static async exitLockdown(guild, interaction) {
		const lockedChannels = await db.get('lockdown', { column: 'lockdown', filter: true });

		if (lockedChannels.length === 0) {
			throw new Error('Server is currently not under lockdown.');
		}

		await interaction?.editReply({ embeds: [new EmbedBuilder()
			.setDescription(`Unlocking ${lockedChannels.length} channels...`)
			.setColor('DarkBlue'),
		] });

		const channelUnlockingFails = []; // Only for the interaction
		let unlockedChannelsCount = 0; // And only for the interaction
		for (const lockedChannel of lockedChannels) {
			const revived = ChannelLocking.reviveLockedChannelData(lockedChannel);
			const channel = guild.channels.cache.get(revived.channelId);
			if (!channel) {
				channelUnlockingFails.push(`<#${channel.id}>: Channel not found`);
				continue;
			}

			await ChannelLocking.unlockChannel(channel, revived, 'Lockdown end command')
				.then(
					() => unlockedChannelsCount += 1,
					(error) => {
						channelUnlockingFails.push(`<#${channel.id}>: ${error}`);
					});
		}

		return { unlockedChannels: unlockedChannelsCount, totalChannels: lockedChannels.length, fails: channelUnlockingFails };
	}
}

module.exports.ChannelLocking = ChannelLocking;