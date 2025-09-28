const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAction } = require('../../utils/logger.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Deletes a specified number of messages from this channel.')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('The number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        
        await interaction.deferReply({ ephemeral: true });

        const messages = await interaction.channel.bulkDelete(amount, true);

        if (messages.size === 0) {
            return interaction.editReply({ content: 'Could not delete any messages. They may be older than 14 days.' });
        }
        
        await interaction.editReply({ content: `✅ Successfully deleted **${messages.size}** messages.` });

        // Logging the action
        const logEmbed = new EmbedBuilder()
            .setColor('#f44336')
            .setTitle('Messages Cleared')
            .addFields(
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Channel', value: interaction.channel.toString(), inline: true },
                { name: 'Amount', value: `${messages.size}`, inline: true },
            )
            .setTimestamp();
        
        await logAction(interaction, logEmbed);
    },
};