const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.inGuild()) return;

        const db = message.client.db;
        const guildId = message.guild.id;
        const userId = message.author.id;

        // --- AFK Logic ---
        // 1. Check if the message author is returning from AFK
        const afkCheck = db.prepare('SELECT * FROM afk WHERE guildId = ? AND userId = ?').get(guildId, userId);
        if (afkCheck) {
            db.prepare('DELETE FROM afk WHERE guildId = ? AND userId = ?').run(guildId, userId);
            const welcomeBackMsg = await message.reply({ content: `Welcome back, ${message.author}! Your AFK status has been removed.` });
            setTimeout(() => welcomeBackMsg.delete(), 5000); // Delete the message after 5 seconds
        }

        // 2. Check if the message mentions any AFK users
        const mentionedUsers = message.mentions.users;
        if (mentionedUsers.size > 0) {
            mentionedUsers.forEach(user => {
                const mentionedAfk = db.prepare('SELECT * FROM afk WHERE guildId = ? AND userId = ?').get(guildId, user.id);
                if (mentionedAfk) {
                    const afkTimestamp = Math.floor(mentionedAfk.timestamp / 1000);
                    message.reply({ content: `**${user.username}** is currently AFK: *${mentionedAfk.message}* (since <t:${afkTimestamp}:R>)` });
                }
            });
        }

        // --- XP Logic ---
        const xpToGive = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
        const stmt = db.prepare(`
            INSERT INTO levels (guildId, userId, xp, level) VALUES (?, ?, ?, 0)
            ON CONFLICT(guildId, userId) DO UPDATE SET xp = xp + ?;
        `);
        stmt.run(guildId, userId, xpToGive, xpToGive);

        const userLevel = db.prepare('SELECT level, xp FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId);
        const { level, xp } = userLevel;
        const xpNeeded = 5 * (level ** 2) + 50 * level + 100;

        if (xp >= xpNeeded) {
            const newLevel = level + 1;
            const updateStmt = db.prepare('UPDATE levels SET level = ?, xp = xp - ? WHERE guildId = ? AND userId = ?');
            updateStmt.run(newLevel, xpNeeded, guildId, userId);
            message.channel.send({ content: `🎉 Congratulations, ${message.author}! You've reached **Level ${newLevel}**!` });
        }
    },
};