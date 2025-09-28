const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Sends a random picture of a cat! 😻'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const response = await axios.get('https://api.thecatapi.com/v1/images/search');
            const catImageUrl = response.data[0].url;

            const catEmbed = new EmbedBuilder()
                .setColor('#ffc0cb')
                .setTitle('Here is a Cat!')
                .setImage(catImageUrl)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [catEmbed] });
        } catch (error) {
            console.error('Cat API Error:', error);
            await interaction.editReply({ content: 'Sorry, I couldn\'t fetch a cat picture right now. The cats might be sleeping!', ephemeral: true });
        }
    },
};