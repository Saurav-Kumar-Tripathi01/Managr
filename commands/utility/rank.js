const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your or another user\'s server rank.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user whose rank you want to see')),

    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const db = interaction.client.db;
        
        const userLevel = db.prepare('SELECT level, xp FROM levels WHERE guildId = ? AND userId = ?').get(interaction.guild.id, target.id);

        if (!userLevel) {
            return interaction.reply({ content: `${target.tag} hasn't earned any XP yet.`, ephemeral: true });
        }

        const { level, xp } = userLevel;
        const xpNeeded = 5 * (level ** 2) + 50 * level + 100;
        
        const rankEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setAuthor({ name: `Rank for ${target.username}`, iconURL: target.displayAvatarURL() })
            .addFields(
                { name: 'Level', value: `**${level}**`, inline: true },
                { name: 'XP', value: `**${xp} / ${xpNeeded}**`, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [rankEmbed] });
    },
};