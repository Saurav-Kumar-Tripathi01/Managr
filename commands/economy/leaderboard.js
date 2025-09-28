const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the top 10 richest users.'),
    async execute(interaction) {
        const db = interaction.client.db;
        
        const top10 = db.prepare('SELECT userId, balance FROM economy ORDER BY balance DESC LIMIT 10').all();

        if (top10.length === 0) {
            return interaction.reply({ content: 'The leaderboard is empty right now.', ephemeral: true });
        }
        
        await interaction.deferReply();
        
        const leaderboardEntries = await Promise.all(
            top10.map(async (entry, index) => {
                try {
                    const user = await interaction.client.users.fetch(entry.userId);
                    return `**${index + 1}.** ${user.username} - **${entry.balance} coins** 🪙`;
                } catch {
                    return `**${index + 1}.** *Unknown User* - **${entry.balance} coins** 🪙`;
                }
            })
        );
        
        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('Global Coin Leaderboard')
            .setDescription(leaderboardEntries.join('\n'))
            .setTimestamp();
            
        await interaction.editReply({ embeds: [leaderboardEmbed] });
    },
};