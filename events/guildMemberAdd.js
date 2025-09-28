const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const db = member.client.db;
        
        // Find the welcome channel setting for this server
        const stmt = db.prepare('SELECT welcomeChannelId FROM settings WHERE guildId = ?');
        const setting = stmt.get(member.guild.id);

        // If no welcome channel is set, do nothing.
        if (!setting || !setting.welcomeChannelId) {
            return;
        }

        // Find the channel object
        const welcomeChannel = member.guild.channels.cache.get(setting.welcomeChannelId);
        if (!welcomeChannel) {
            return; // Channel might have been deleted
        }

        const welcomeEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription(`Hello ${member}, we're glad to have you! Say hi to everyone! 👋`)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
        
        welcomeChannel.send({ embeds: [welcomeEmbed] });
    },
};