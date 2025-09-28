const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dayjs = require('dayjs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Provides information about a user.')
        // Add a user option to the command
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user you want to get info about')
                .setRequired(false)), // This option is not required
    async execute(interaction) {
        // Get the user from the option, or default to the user who ran the command
        const targetUser = interaction.options.getUser('target') || interaction.user;
        
        // We need the GuildMember object to get roles and join date
        const targetMember = await interaction.guild.members.fetch(targetUser.id);

        const userEmbed = new EmbedBuilder()
            .setColor('#a300ff')
            .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 User ID', value: targetUser.id },
                { name: '🤖 Is Bot', value: targetUser.bot ? 'Yes' : 'No', inline: true },
                { name: '✨ Highest Role', value: `${targetMember.roles.highest}`, inline: true },
                { name: '📅 Account Created', value: dayjs(targetUser.createdAt).format('DD/MM/YYYY'), inline: true },
                { name: '📥 Joined Server', value: dayjs(targetMember.joinedAt).format('DD/MM/YYYY'), inline: true },
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
        
        await interaction.reply({ embeds: [userEmbed] });
    },
};