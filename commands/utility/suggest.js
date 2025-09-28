const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion for the server.'),
    async execute(interaction) {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('suggestionModal')
            .setTitle('Server Suggestion');

        // Create the text input components
        const titleInput = new TextInputBuilder()
            .setCustomId('suggestionTitle')
            .setLabel("What's the title of your suggestion?")
            .setStyle(TextInputStyle.Short) // For a single-line input
            .setRequired(true);

        const detailsInput = new TextInputBuilder()
            .setCustomId('suggestionDetails')
            .setLabel("Describe your suggestion in detail.")
            .setStyle(TextInputStyle.Paragraph) // For a multi-line input
            .setRequired(true);

        // Add inputs to the modal
        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(detailsInput);
        modal.addComponents(firstActionRow, secondActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};