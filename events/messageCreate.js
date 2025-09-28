const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore messages from bots and DMs
        if (message.author.bot || !message.inGuild()) return;

        const db = message.client.db;
        const guildId = message.guild.id;
        const userId = message.author.id;

        // Give a random amount of XP (e.g., 15-25)
        const xpToGive = Math.floor(Math.random() * (25 - 15 + 1)) + 15;

        // Prepare the UPSERT statement
        const stmt = db.prepare(`
            INSERT INTO levels (guildId, userId, xp, level) VALUES (?, ?, ?, 0)
            ON CONFLICT(guildId, userId) DO UPDATE SET xp = xp + ?;
        `);
        stmt.run(guildId, userId, xpToGive, xpToGive);

        // Retrieve the user's current level and XP
        const userLevel = db.prepare('SELECT level, xp FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId);

        const { level, xp } = userLevel;
        const xpNeeded = 5 * (level ** 2) + 50 * level + 100;

        // Check for level up
        if (xp >= xpNeeded) {
            const newLevel = level + 1;
            const updateStmt = db.prepare('UPDATE levels SET level = ?, xp = xp - ? WHERE guildId = ? AND userId = ?');
            updateStmt.run(newLevel, xpNeeded, guildId, userId);
            
            message.channel.send({
                content: `🎉 Congratulations, ${message.author}! You've reached **Level ${newLevel}**!`
            });
        }
    },
};