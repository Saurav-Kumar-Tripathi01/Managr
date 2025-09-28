const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your or another user\'s coin balance.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user whose balance you want to see')),
    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const db = interaction.client.db;

        const user = db.prepare('SELECT balance FROM economy WHERE userId = ?').get(target.id);
        const balance = user ? user.balance : 0;

        const balanceEmbed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setAuthor({ name: `${target.username}'s Wallet`, iconURL: target.displayAvatarURL() })
            .setDescription(`They have **${balance} coins** 🪙.`)
            .setTimestamp();
        
        await interaction.reply({ embeds: [balanceEmbed] });
    },
};