const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Gets the current weather for a specified city.')
        .addStringOption(option =>
            option.setName('city').setDescription('The city to get weather for').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const city = interaction.options.getString('city');
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            return interaction.editReply('The weather API key is not configured. Please contact the bot owner.');
        }

        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            const weatherEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Weather in ${data.location.name}, ${data.location.country}`)
                .setDescription(`**${data.current.condition.text}**`)
                .setThumbnail(`https:${data.current.condition.icon}`)
                .addFields(
                    { name: 'Temperature', value: `${data.current.temp_c}°C / ${data.current.temp_f}°F`, inline: true },
                    { name: 'Feels Like', value: `${data.current.feelslike_c}°C / ${data.current.feelslike_f}°F`, inline: true },
                    { name: 'Humidity', value: `${data.current.humidity}%`, inline: true },
                    { name: 'Wind', value: `${data.current.wind_kph} kph / ${data.current.wind_mph} mph`, inline: true },
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by WeatherAPI.com' });

            await interaction.editReply({ embeds: [weatherEmbed] });
        } catch (error) {
            console.error('Weather API Error:', error);
            await interaction.editReply({ content: `Could not find weather data for **${city}**. Please check the city name and try again.`, ephemeral: true });
        }
    },
};