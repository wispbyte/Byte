const { SlashCommandBuilder, InteractionContextType, ChannelType, PermissionFlagsBits, GuildChannel, NewsChannel, ForumChannel, MediaChannel, TextChannel, VoiceChannel, StageChannel, MessageFlags, EmbedBuilder } = require("discord.js");
const { ChannelLocking, parseTime, formatDiscordTime } = require("../utilities/functions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lock")
        .setDescription("Locks a channel that is publicly writable, for an optional duration")
        .setContexts(InteractionContextType.Guild)
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel to lock")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildMedia, ChannelType.GuildText, ChannelType.GuildVoice,
                    ChannelType.GuildStageVoice)
        )
        .addStringOption(option =>
            option.setName("duration")
                .setDescription("How long the channel should remain locked.")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.MuteMembers),
    /**
     * 
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply();
        /**
         * @type {NewsChannel | ForumChannel | MediaChannel | TextChannel | VoiceChannel | StageChannel}
         */
        const channel = interaction.options.getChannel("channel", true);
        const durationArg = interaction.options.getString("duration", false);

        const duration = durationArg ? parseTime(durationArg) : undefined;
        if (duration < 10) { //why would you use the duration parameter just to lock the channel for 10 seconds
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setDescription("Please set a higher duration than 10 seconds.")
                    .setColor("Red")
                ]
            });
            return;
        } 

        await ChannelLocking.lockChannel(channel, false, "Lock command").then(
            async () => {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle("Channel locked")
                        .setDescription(`<#${channel.id}> has been locked successfully.`)
                        .setColor("DarkBlue")
                    ]
                });

                if (duration){
                    const startTime = Date.now();
                    setTimeout(async() => {
                        if ((await ChannelLocking.getAndReviveLockedChannelData(channel.id)) === null) return; //channel has been unlocked
                        await ChannelLocking.unlockChannel(channel, null, "Automatic unlock", true).finally(() => {
                            interaction.channel?.send({
                                embeds: [new EmbedBuilder()
                                    .setTitle("Channel unlocked")
                                    .setDescription(`<#${channel.id}> has been automatically unlocked, it was locked ${formatDiscordTime(startTime, "R")}.`)
                                    .setColor("DarkBlue")
                                ]
                            });
                        });
                    }, duration * 1000);
                }
            },
            async(error) => {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle("Channel not locked")
                        .setDescription(`Couldn't lock <#${channel.id}>: ${error}`)
                        .setColor("Red")
                    ]
                })
            }
        );
    }
}