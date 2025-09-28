const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song.'),
    async execute(interaction) {
        const serverQueue = interaction.client.queues.get(interaction.guild.id);

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: 'You need to be in a voice channel to skip music!', ephemeral: true });
        }
        if (!serverQueue || serverQueue.songs.length === 0) {
            return interaction.reply({ content: 'There is no song to skip!', ephemeral: true });
        }

        serverQueue.player.stop(); // This triggers the 'idle' event, which plays the next song
        await interaction.reply({ content: '⏭️ Skipped the song!' });
    },
};