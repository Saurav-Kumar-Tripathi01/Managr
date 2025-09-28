// utils/logger.js
async function logAction(interaction, embed) {
    const db = interaction.client.db;
    
    // Find the log channel setting for this server
    const stmt = db.prepare('SELECT logChannelId FROM settings WHERE guildId = ?');
    const setting = stmt.get(interaction.guild.id);

    // If no log channel is set, do nothing.
    if (!setting || !setting.logChannelId) {
        return;
    }

    // Find the channel object
    const logChannel = interaction.guild.channels.cache.get(setting.logChannelId);
    if (!logChannel) {
        return; // Channel might have been deleted
    }
    
    // Send the log embed
    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Could not send log message to channel ${logChannel.id}`, error);
    }
}

module.exports = { logAction };