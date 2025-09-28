const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot settings for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-welcome-channel')
                .setDescription('Sets the channel for welcome messages.')
                .addChannelOption(option =>
                    option.setName('channel').setDescription('The welcome channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-log-channel')
                .setDescription('Sets the channel for moderation logs.')
                .addChannelOption(option =>
                    option.setName('channel').setDescription('The log channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        // --- ADD THIS BLOCK ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-goodbye-channel')
                .setDescription('Sets the channel for goodbye messages.')
                .addChannelOption(option =>
                    option.setName('channel').setDescription('The goodbye channel').addChannelTypes(ChannelType.GuildText).setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel');
        const db = interaction.client.db;

        let columnName = '';
        if (subcommand === 'set-welcome-channel') {
            columnName = 'welcomeChannelId';
        } else if (subcommand === 'set-log-channel') {
            columnName = 'logChannelId';
        // --- AND ADD THIS BLOCK ---
        } else if (subcommand === 'set-goodbye-channel') {
            columnName = 'goodbyeChannelId';
        }

        const stmt = db.prepare(`
            INSERT INTO settings (guildId, ${columnName}) VALUES (?, ?)
            ON CONFLICT(guildId) DO UPDATE SET ${columnName} = excluded.${columnName};
        `);
        
        stmt.run(interaction.guild.id, channel.id);

        await interaction.reply({
            content: `✅ The ${subcommand.replace(/-/g, ' ')} has been set to ${channel}!`,
            flags: [ 64 ] // Ephemeral flag
        });
    },
};