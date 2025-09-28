const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Displays a user\'s avatar.')
        .addUserOption(option => 
            option.setName('user').setDescription('The user whose avatar you want to see')),
    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;

        const avatarEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle(`${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setTimestamp();
            
        await interaction.reply({ embeds: [avatarEmbed] });
    },
};