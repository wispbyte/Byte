const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('../utilities/config.json')

const TAGS_FILE = './utilities/tags.json';
let tags = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Manage tags')
        .addSubcommand(sub =>
            sub.setName('view').setDescription('View a tag')
                .addStringOption(opt => opt.setName('name').setDescription('Tag name').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(sub =>
            sub.setName('add').setDescription('Add a tag')
                .addStringOption(opt => opt.setName('name').setDescription('Tag name').setRequired(true))
                .addStringOption(opt => opt.setName('description').setDescription(`Tag description, use \n to skip a line`).setRequired(true))
                .addStringOption(opt => opt.setName('title').setDescription('Tag title').setRequired(true))
                .addStringOption(opt => opt.setName('footer').setDescription('Footer').setRequired(false))
                .addStringOption(opt => opt.setName('footer_image').setDescription('Footer image URL').setRequired(false))
                .addStringOption(opt => opt.setName('color').setDescription('Embed color (hex)').setRequired(false))
                .addStringOption(opt => opt.setName('thumbnail').setDescription('Thumbnail URL').setRequired(false))
                .addStringOption(opt => opt.setName('image').setDescription('Image URL').setRequired(false))
                .addStringOption(opt => opt.setName('author').setDescription('Author').setRequired(false))
                .addStringOption(opt => opt.setName('timestamp').setDescription('Timestamp (true/false)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('edit').setDescription('Edit a tag')
                .addStringOption(opt => opt.setName('name').setDescription('Tag to edit').setRequired(true).setAutocomplete(true))
                .addStringOption(opt => opt.setName('field').setDescription('Field to modify').setRequired(true)
                    .addChoices(
                        { name: 'Title', value: 'title' },
                        { name: 'Description', value: 'description' },
                        { name: 'Footer', value: 'footer' },
                        { name: 'Footer Image', value: 'footer_image' },
                        { name: 'Color', value: 'color' },
                        { name: 'Image', value: 'image' },
                        { name: 'Thumbnail', value: 'thumbnail' },
                        { name: 'Author', value: 'author' },
                        { name: 'Timestamp', value: 'timestamp' }
                    )
                )
                .addStringOption(opt => opt.setName('value').setDescription('New value').setRequired(true))
        )
        .addSubcommand(sub => sub.setName('list').setDescription('List all tags'))
        .addSubcommand(sub =>
            sub.setName('delete').setDescription('Delete a tag')
                .addStringOption(opt => opt.setName('name').setDescription('Tag to delete').setRequired(true).setAutocomplete(true))
        ),

    async execute(interaction) {
        if (!config.moderators.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const tagName = interaction.options.getString('name')?.toLowerCase();
        
        if (subcommand === 'view') {
            const tag = tags[tagName];
            if (!tag) return interaction.reply({ content: `❌ No tag found for: ${tagName}`, ephemeral: true });
            
            const embed = new EmbedBuilder()
                .setTitle(tag.title || 'No title')
                .setDescription(tag.description.replace(/\\n/g, '\n'))
                .setColor(tag.color || '#ed1b24')
                .setFooter({ text: tag.footer, iconURL: tag.footer_image || null })
                .setThumbnail(tag.thumbnail || null)
                .setImage(tag.image || null)
                .setAuthor({ name: tag.author || null })
                .setTimestamp(tag.timestamp || null);

                await interaction.deferReply({ ephemeral: true });
                await interaction.deleteReply();
                await interaction.channel.send({ embeds: [embed] });
        } else if (subcommand === 'add') {
            tags[tagName] = {
                title: interaction.options.getString('title'),
                description: interaction.options.getString('description'),
                footer: interaction.options.getString('footer') || 'WispByte',
                footer_image: interaction.options.getString('footer_image') || 'https://i.imgur.com/3x6bom0.png',
                color: interaction.options.getString('color') || '#ed1b24',
                thumbnail: interaction.options.getString('thumbnail') || '',
                image: interaction.options.getString('image') || '',
                author: interaction.options.getString('author') || '',
                timestamp: interaction.options.getString('timestamp') === true || false
            };
            fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2));
            await interaction.reply({ content: `✅ Tag '${tagName}' added!`, ephemeral: true });
        } else if (subcommand === 'edit') {
            if (!tags[tagName]) return interaction.reply({ content: `❌ No tag found for: ${tagName}`, ephemeral: true });
            tags[tagName][interaction.options.getString('field')] = interaction.options.getString('value');
            fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2));
            await interaction.reply({ content: `✅ Tag '${tagName}' edited!`, ephemeral: true });
        } else if (subcommand === 'list') {
            const tagList = Object.keys(tags).join(', ') || 'No tags available.';
            await interaction.reply({ content: `Tags: ${tagList}`, ephemeral: true });
        } else if (subcommand === 'delete') {
            if (!tags[tagName]) return interaction.reply({ content: `❌ No tag found for: ${tagName}`, ephemeral: true });
            delete tags[tagName];
            fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2));
            await interaction.reply({ content: `✅ Tag '${tagName}' deleted!`, ephemeral: true });
        }
    },

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        if (focused.name === 'name') {
            const tagNames = Object.keys(tags)
                .filter(tag => tag.startsWith(focused.value.toLowerCase()))
                .slice(0, 25);
            await interaction.respond(tagNames.map(tag => ({ name: tag, value: tag })));
        }
    }
};