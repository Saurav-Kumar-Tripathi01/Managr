const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and clears the queue.'),
    async execute(interaction) {
        const serverQueue = interaction.client.queues.get(interaction.guild.id);

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: 'You need to be in a voice channel to stop music!', ephemeral: true });
        }
        if (!serverQueue) {
            return interaction.reply({ content: 'There is no music to stop!', ephemeral: true });
        }

        serverQueue.songs = []; // Clear the song array
        serverQueue.connection.destroy(); // Disconnect
        interaction.client.queues.delete(interaction.guild.id); // Delete the queue from the map
        
        await interaction.reply({ content: '⏹️ Stopped the music and cleared the queue!' });
    },
};