const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user, log it, and notify them via DM.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        const db = interaction.client.db;

        // Create the embed for the DM
        const dmEmbed = new EmbedBuilder()
            .setColor('#ff4500')
            .setTitle(`You have been warned in: ${interaction.guild.name}`)
            .setThumbnail(interaction.guild.iconURL()) // Adds the server icon
            .addFields(
                { name: '📜 Reason', value: reason },
                { name: 'Moderator', value: interaction.user.tag }
            )
            .setTimestamp()
            .setFooter({ text: 'Please follow the server rules.' });

        // Attempt to send the DM to the user
        let dmSent = true;
        try {
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            dmSent = false;
            console.warn(`Could not send a warning DM to ${target.tag}. They may have DMs disabled.`);
        }
        
        // Log the warning to the database regardless of DM status
        const stmt = db.prepare('INSERT INTO warnings (guildId, userId, moderatorId, reason, timestamp) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(interaction.guild.id, target.id, interaction.user.id, reason, Date.now());

        // Create the confirmation embed for the server channel
        const confirmationEmbed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('User Warned')
            .setDescription(`**${target.tag}** has been warned. This is warning #${info.lastInsertRowid}.`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Moderator', value: interaction.user.tag },
                { name: 'Notified User via DM', value: dmSent ? '✅ Yes' : '❌ No (DMs may be off)' }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [confirmationEmbed] });

        // Create the log embed
        const logEmbed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('Member Warned')
            .addFields(
                { name: 'User', value: target.tag, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();
        
        // Send the log
        await logAction(interaction, logEmbed);

    },
};