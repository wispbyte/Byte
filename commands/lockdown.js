const { MessageFlags, InteractionContextType } = require("discord.js");
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { ChannelLocking, parseTime } = require("../utilities/functions");
require("#log");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lockdown")
        .setDescription("Quickly locks public server channels")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.MuteMembers)
        .addSubcommand((subcommand) =>
            subcommand.setName("start")
                .setDescription("Starts a lockdown, with optional duration")
                .addStringOption(option =>
                    option.setName("duration")
                        .setDescription("How long should the lockdown last")
                        .setRequired(false)
                        .setMinLength(2)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("end")
                .setDescription("Ends the current lockdown")
        )
        .setContexts(InteractionContextType.Guild),

    /**
     * 
     * @param {import("discord.js").ChatInputCommandInteraction<true>} interaction
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand(true);

        if (subcommand === "start") { //lockdown
            await executeLockdownStart(interaction);
        } else if (subcommand === "end") {
            await executeLockdownEnd(interaction);
        } else {
            //What else?
            console.error("/lockdown unrecognized command:", subcommand);

            await interaction.reply({
                Flags: MessageFlags.Ephemeral, embeds: [
                    new EmbedBuilder()
                        .setTitle("Unknown subcommand")
                        .setDescription(`Subcommand \`${subcommand}\` was not recognized.`)
                        .setColor("Red")
                ]
            });
        }
        return;
    }
}

/**
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
async function executeLockdownStart(interaction) {
    await interaction.deferReply();

    const durationArg = interaction.options.getString("duration", false);
    const duration = durationArg ? parseTime(durationArg) : undefined;
    console.warn("Make sure to change duration condition back to 60 * 5.");
    if (duration < 1 * 5){ //who is going to lockdown the server for that short amount of time? Even 5 minutes is short, but whatever.
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setDescription("The server cannot be under lockdown for less than 5 minutes.")
                .setColor("Red")
            ]
        });
        return;
    }

    const underLockdown = await ChannelLocking.isAnyChannelUnderLockdown();
    if (underLockdown) {
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setDescription("Server is already under lockdown.")
                .setColor("Red")
            ]
        });
        return;
    }
    const { lockedChannels, fails, totalChannels } = await ChannelLocking.enterLockdown(interaction.guild, duration, interaction);

    let replyEmbed = new EmbedBuilder()
        .setTitle("Lockdown started")
        .setDescription(`The server has went under lockdown and ${lockedChannels}/${totalChannels} channels have been locked successfully.`)
        .setColor("DarkBlue")
        .setTimestamp(Date.now());

    if (fails.length > 0) {
        replyEmbed = replyEmbed.setDescription(
            replyEmbed.data.description += `\nCouldn't lock ${fails.length} channel(s):\n> ${fails.join("\n> ")}`
        );
    }

    await interaction.editReply({
        embeds: [replyEmbed]
    });
}

/**
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
async function executeLockdownEnd(interaction) {
    await interaction.deferReply();

    const underLockdown = await ChannelLocking.isAnyChannelUnderLockdown();
    if (!underLockdown) {
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setDescription("Server is currently not under lockdown.")
                .setColor("Red")
            ]
        });
        return;
    }

    const { fails, totalChannels, unlockedChannels } = await ChannelLocking.exitLockdown(interaction.guild, interaction);

    let replyEmbed = new EmbedBuilder()
        .setTitle("Lockdown ended")
        .setDescription(`The server has left lockdown and ${unlockedChannels}/${totalChannels} channels have been unlocked successfully.`)
        .setColor("DarkBlue")
        .setTimestamp(Date.now());

    if (fails.length > 0) {
        replyEmbed = replyEmbed.setDescription(
            replyEmbed.data.description += `\nCouldn't unlock ${fails.length} channel(s):\n> ${fails.join("\n> ")}`
        );
    }

    await interaction.editReply({
        embeds: [replyEmbed]
    });
}