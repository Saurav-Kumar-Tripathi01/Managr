const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Check the warnings for a specific user.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to check')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const db = interaction.client.db;

        // Prepare and run the SQL SELECT statement
        const stmt = db.prepare('SELECT moderatorId, reason, timestamp FROM warnings WHERE guildId = ? AND userId = ? ORDER BY timestamp DESC');
        const warnings = stmt.all(interaction.guild.id, target.id);

        if (warnings.length === 0) {
            return interaction.reply({ content: `**${target.tag}** has no warnings.`, ephemeral: true });
        }

        const warningsEmbed = new EmbedBuilder()
            .setColor('#f0e68c')
            .setTitle(`Warnings for ${target.tag}`)
            .setTimestamp();

        // Format the warnings into a single string for the description
        const warningsList = warnings.map((warn, index) => {
            const moderator = `<@${warn.moderatorId}>`;
            const date = `<t:${Math.floor(warn.timestamp / 1000)}:R>`; // e.g., "2 days ago"
            return `**${index + 1}.** ${date} by ${moderator}\n*Reason:* ${warn.reason}`;
        }).join('\n\n');

        warningsEmbed.setDescription(warningsList);

        await interaction.reply({ embeds: [warningsEmbed] });
    },
};