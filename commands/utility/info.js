const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dayjs = require('dayjs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get info about a user or the server.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Info about a user')
                .addUserOption(option => option.setName('target').setDescription('The user')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Info about the server')),

    async execute(interaction) {
        // Check which subcommand was used
        if (interaction.options.getSubcommand() === 'user') {
            const user = interaction.options.getUser('target') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id);

            const userEmbed = new EmbedBuilder()
                .setColor('#a300ff')
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'User ID', value: user.id },
                    { name: 'Highest Role', value: `${member.roles.highest}`, inline: true },
                    { name: 'Account Created', value: dayjs(user.createdAt).format('DD/MM/YYYY'), inline: true },
                    { name: 'Joined Server', value: dayjs(member.joinedAt).format('DD/MM/YYYY'), inline: true },
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [userEmbed] });

        } else if (interaction.options.getSubcommand() === 'server') {
            const guild = interaction.guild;
            const owner = await guild.fetchOwner();

            const serverEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Server Info: ${guild.name}`)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: 'Owner', value: `${owner.user.tag}`, inline: true },
                    { name: 'Members', value: `${guild.memberCount}`, inline: true },
                    { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                    { name: 'Created On', value: dayjs(guild.createdAt).format('DD/MM/YYYY') },
                )
                .setTimestamp();

            await interaction.reply({ embeds: [serverEmbed] });
        }
    },
};