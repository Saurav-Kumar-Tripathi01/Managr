const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const DAILY_AMOUNT = 250; // The amount of currency to give
const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const db = interaction.client.db;
        
        const user = db.prepare('SELECT lastDaily FROM economy WHERE userId = ?').get(userId);
        const lastDaily = user ? user.lastDaily : 0;
        const now = Date.now();
        
        if (now - lastDaily < COOLDOWN) {
            const timeLeft = COOLDOWN - (now - lastDaily);
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return interaction.reply({ content: `You've already claimed your daily reward. Please wait ${hours}h ${minutes}m.`, ephemeral: true });
        }
        
        // UPSERT the new balance and timestamp
        const stmt = db.prepare(`
            INSERT INTO economy (userId, balance, lastDaily) VALUES (?, ?, ?)
            ON CONFLICT(userId) DO UPDATE SET balance = balance + ?, lastDaily = ?;
        `);
        stmt.run(userId, DAILY_AMOUNT, now, DAILY_AMOUNT, now);
        
        const dailyEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('Daily Reward Claimed!')
            .setDescription(`You have received **${DAILY_AMOUNT} coins**! 🪙 Your next claim is available in 24 hours.`)
            .setTimestamp();

        await interaction.reply({ embeds: [dailyEmbed] });
    },
};