const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('View Avatar')
        .setType(ApplicationCommandType.User), // This makes it a user context menu command

    async execute(interaction) {
        const target = interaction.targetUser;

        const avatarEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle(`${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 })) // Get the highest quality avatar
            .setTimestamp();

        await interaction.reply({ embeds: [avatarEmbed], ephemeral: true });
    },
};