const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Sets or removes your AFK status.')
        .addStringOption(option => 
            option.setName('message')
                  .setDescription('The message to display when someone mentions you.')),
    async execute(interaction) {
        const message = interaction.options.getString('message') ?? 'AFK';
        const db = interaction.client.db;

        const stmt = db.prepare(`
            INSERT INTO afk (guildId, userId, message, timestamp) VALUES (?, ?, ?, ?)
            ON CONFLICT(guildId, userId) DO UPDATE SET message = excluded.message, timestamp = excluded.timestamp;
        `);
        stmt.run(interaction.guild.id, interaction.user.id, message, Date.now());

        await interaction.reply({ content: `✅ Your AFK status has been set to: **${message}**`, ephemeral: true });
    },
};