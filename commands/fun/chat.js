const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Have a conversation with the bot\'s AI.')
        .addStringOption(option =>
            option.setName('message').setDescription('The message to send to the AI.').setRequired(true)),
            
    async execute(interaction) {
        await interaction.deferReply();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return interaction.editReply('The AI API key is not configured. Please contact the bot owner.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = interaction.options.getString('message');
        const userId = interaction.user.id;
        
        // Get or create a chat session for the user
        let chatSession = interaction.client.chatSessions.get(userId);
        if (!chatSession) {
            chatSession = model.startChat({
                history: [], // You can add a starting prompt here if you want
            });
            interaction.client.chatSessions.set(userId, chatSession);
        }

        try {
            const result = await chatSession.sendMessage(prompt);
            const response = await result.response;
            const text = response.text();

            const chatEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(prompt) // The user's message
                .addFields({ name: 'Manager AI', value: text }); // The AI's response

            await interaction.editReply({ embeds: [chatEmbed] });
        } catch (error) {
            console.error('Gemini API Error:', error);
            await interaction.editReply({ content: 'An error occurred while communicating with the AI. Please try again later.', ephemeral: true });
        }
    },
};