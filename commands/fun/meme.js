const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random meme from Reddit.'),
    async execute(interaction) {
        // Defer the reply to give the API time to respond
        await interaction.deferReply();

        try {
            // Make a GET request to the meme API
            const response = await axios.get('https://meme-api.com/gimme');
            const { title, url, postLink, author } = response.data;

            const memeEmbed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle(title)
                .setURL(postLink)
                .setImage(url) // The meme image
                .setTimestamp()
                .setFooter({ text: `From r/memes by ${author}` });
            
            // Edit the deferred reply with the embed
            await interaction.editReply({ embeds: [memeEmbed] });

        } catch (error) {
            console.error('Meme API Error:', error);
            await interaction.editReply({ content: 'Sorry, I couldn\'t fetch a meme right now. Please try again later.', ephemeral: true });
        }
    },
};