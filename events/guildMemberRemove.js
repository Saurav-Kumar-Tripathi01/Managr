const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const db = member.client.db;
        
        const stmt = db.prepare('SELECT goodbyeChannelId FROM settings WHERE guildId = ?');
        const setting = stmt.get(member.guild.id);

        if (!setting || !setting.goodbyeChannelId) return;

        const goodbyeChannel = member.guild.channels.cache.get(setting.goodbyeChannelId);
        if (!goodbyeChannel) return;

        const goodbyeEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('Goodbye!')
            .setDescription(`**${member.user.tag}** has left the server. We'll miss them!`)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
        
        goodbyeChannel.send({ embeds: [goodbyeEmbed] });
    },
};