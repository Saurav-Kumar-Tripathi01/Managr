const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const play = require('play-dl');

module.log = (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from YouTube.')
        .addStringOption(option =>
            option.setName('song').setDescription('The name or URL of the song').setRequired(true)),
            
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
        }

        await interaction.deferReply();

        const query = interaction.options.getString('song');
        
        module.log(`Searching for query: "${query}"`);
        const searchResults = await play.search(query, {
            limit: 1,
            source: { youtube: 'video' }
        });

        if (searchResults.length === 0) {
            module.log(`No search results found for: "${query}"`);
            return interaction.editReply({ content: 'Could not find any video results for that query.' });
        }
        
        const video = searchResults[0];
        const song = {
            title: video.title,
            url: video.url,
        };
        
        module.log(`Found video: "${song.title}" with URL: ${song.url}`);
        
        let serverQueue = interaction.client.queues.get(interaction.guild.id);

        if (!serverQueue) {
            const queueConstructor = {
                voiceChannel: voiceChannel,
                textChannel: interaction.channel,
                connection: null,
                player: createAudioPlayer(),
                songs: []
            };
            interaction.client.queues.set(interaction.guild.id, queueConstructor);
            queueConstructor.songs.push(song);

            try {
                module.log('Joining voice channel...');
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
                queueConstructor.connection = connection;
                
                playSong(interaction.guild, queueConstructor.songs[0], interaction.client.queues);
                await interaction.editReply({ content: `▶️ Now playing: **${song.title}**` });

            } catch (error) {
                interaction.client.queues.delete(interaction.guild.id);
                console.error(error);
                return interaction.editReply({ content: 'Could not join the voice channel.' });
            }
        } else {
            serverQueue.songs.push(song);
            module.log(`Added "${song.title}" to the queue.`);
            return interaction.editReply({ content: `👍 Added **${song.title}** to the queue!` });
        }
    },
};

const playSong = async (guild, song, queues) => {
    const serverQueue = queues.get(guild.id);
    // Prevent crash if song is undefined
    if (!song) {
        if (serverQueue && serverQueue.textChannel) {
            serverQueue.textChannel.send('✅ The music queue is now empty.');
        }
        setTimeout(() => {
            const currentQueue = queues.get(guild.id);
            if (currentQueue && currentQueue.songs.length === 0) {
                currentQueue.connection.destroy();
                queues.delete(guild.id);
            }
        }, 300_000);
        return;
    }
    try {
        module.log(`Attempting to stream URL: ${song.url}`);
        // Validate the URL before streaming
        const isValid = await play.validate(song.url);
        if (!isValid) {
            module.log(`Invalid URL detected: ${song.url}`);
            serverQueue.textChannel.send(`❌ The URL for **${song.title}** is invalid or unsupported. Skipping to the next song.`);
            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0], queues);
            return;
        }

        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });

        serverQueue.player.play(resource);
        serverQueue.connection.subscribe(serverQueue.player);
        module.log(`Successfully started playing: "${song.title}"`);

        serverQueue.player.removeAllListeners('error');
        serverQueue.player.on('error', error => {
            console.error(`AudioPlayer Error: ${error.message}`);
            serverQueue.textChannel.send(`An error occurred while playing **${song.title}**. Skipping...`);
            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0], queues);
        });

        serverQueue.player.removeAllListeners(AudioPlayerStatus.Idle);
        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            module.log(`Finished playing: "${song.title}". Moving to next song.`);
            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0], queues);
        });
    } catch (error) {
        console.error(`Error in playSong function: ${error.message}`);
        // Prevent crash if song is undefined
        if (song && serverQueue && serverQueue.textChannel) {
            serverQueue.textChannel.send(`Could not play **${song.title}**. Skipping to the next song.`);
        }
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0], queues);
    }
};