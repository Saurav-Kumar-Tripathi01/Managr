const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-chat')
        .setDescription('Clears your conversation history with the AI.'),
    async execute(interaction) {
        interaction.client.chatSessions.delete(interaction.user.id);
        await interaction.reply({ content: 'Your chat history has been cleared.', ephemeral: true });
    },
};