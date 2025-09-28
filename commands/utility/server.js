const { SlashCommandBuilder, EmbedBuilder, GuildPremiumTier } = require('discord.js');
const dayjs = require('dayjs');

// Helper to make the boost level more readable
const boostLevelMap = {
    [GuildPremiumTier.None]: 'Level 0',
    [GuildPremiumTier.Tier1]: 'Level 1',
    [GuildPremiumTier.Tier2]: 'Level 2',
    [GuildPremiumTier.Tier3]: 'Level 3',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Provides information about the server.'),
    async execute(interaction) {
        // No need to defer here, as we aren't doing any long-running tasks
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();

        const serverEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Server Info: ${guild.name}`)
            .setThumbnail(guild.iconURL()) // Get the server's icon
            .addFields(
                { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },
                { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
                { name: '🆔 Server ID', value: guild.id },
                { name: '🎂 Created On', value: dayjs(guild.createdAt).format('DD/MM/YYYY'), inline: true },
                { name: '🚀 Boost Level', value: boostLevelMap[guild.premiumTier], inline: true },
                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [serverEmbed] });
    },
};