const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// --- ADD THIS OBJECT TO MAP CHOICES TO EMOJIS ---
const emojiMap = {
    rock: '🗿',
    paper: '📄',
    scissors: '✂️'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play a game of Rock, Paper, Scissors.')
        .addUserOption(option =>
            option
                .setName('opponent')
                .setDescription('Challenge another user to a game.')
                .setRequired(false)),

    async execute(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('opponent');
        
        // --- Play against another user ---
        if (opponent) {
            if (opponent.bot || opponent.id === challenger.id) {
                return interaction.reply({ content: "You can't play against yourself or a bot!", ephemeral: true });
            }

            // ... (challenge phase code is the same) ...
            const challengeEmbed = new EmbedBuilder().setTitle('Rock, Paper, Scissors Challenge!').setDescription(`${opponent}, you have been challenged by ${challenger}.`);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('accept_rps').setLabel('Accept').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('decline_rps').setLabel('Decline').setStyle(ButtonStyle.Danger));
            const challengeMessage = await interaction.reply({ content: `${opponent}`, embeds: [challengeEmbed], components: [row] });
            const challengeCollector = challengeMessage.createMessageComponentCollector({ filter: i => i.user.id === opponent.id, time: 60000 });

            challengeCollector.on('collect', async i => {
                challengeCollector.stop();
                if (i.customId === 'decline_rps') {
                    return i.update({ content: 'The challenge was declined.', embeds: [], components: [] });
                }

                const gameEmbed = new EmbedBuilder().setTitle('Rock, Paper, Scissors').setDescription(`Both players, please make your choice!`);
                const gameRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rock').setLabel('Rock').setStyle(ButtonStyle.Secondary).setEmoji('🗿'), new ButtonBuilder().setCustomId('paper').setLabel('Paper').setStyle(ButtonStyle.Secondary).setEmoji('📄'), new ButtonBuilder().setCustomId('scissors').setLabel('Scissors').setStyle(ButtonStyle.Secondary).setEmoji('✂️'));
                await i.update({ embeds: [gameEmbed], components: [gameRow] });
                const gameMessage = await i.fetchReply();
                
                let choices = {};
                const gameCollector = gameMessage.createMessageComponentCollector({ filter: btn => btn.user.id === challenger.id || btn.user.id === opponent.id, time: 60000 });

                gameCollector.on('collect', async btn => {
                    choices[btn.user.id] = btn.customId;
                    await btn.reply({ content: `You chose ${btn.customId}.`, ephemeral: true });
                    
                    if (Object.keys(choices).length === 2) {
                        gameCollector.stop();
                        const challengerChoice = choices[challenger.id];
                        const opponentChoice = choices[opponent.id];
                        
                        // --- THIS RESULT LINE IS NOW FIXED ---
                        let resultText = `**${challenger.username}** chose ${challengerChoice} ${emojiMap[challengerChoice]}\n**${opponent.username}** chose ${opponentChoice} ${emojiMap[opponentChoice]}\n\n`;
                        
                        if (challengerChoice === opponentChoice) resultText += "It's a tie!";
                        else if ((challengerChoice === 'rock' && opponentChoice === 'scissors') || (challengerChoice === 'paper' && opponentChoice === 'rock') || (challengerChoice === 'scissors' && opponentChoice === 'paper')) resultText += `🎉 ${challenger.username} wins!`;
                        else resultText += `🎉 ${opponent.username} wins!`;
                        
                        const resultEmbed = new EmbedBuilder().setTitle('Game Over!').setDescription(resultText);
                        await i.editReply({ embeds: [resultEmbed], components: [] });
                    }
                });
                gameCollector.on('end', (collected, reason) => { if (reason === 'time' && Object.keys(choices).length < 2) i.editReply({ content: 'The game timed out as not everyone made a choice.', embeds: [], components: [] }); });
            });
            challengeCollector.on('end', (collected, reason) => { if (reason === 'time' && collected.size === 0) interaction.editReply({ content: 'The challenge expired.', embeds: [], components: [] }); });
        
        // --- Play against the Bot ---
        } else {
            const gameEmbed = new EmbedBuilder().setTitle('Rock, Paper, Scissors').setDescription('You are playing against me! Make your choice.');
            const gameRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rock').setLabel('Rock').setStyle(ButtonStyle.Secondary).setEmoji('🗿'), new ButtonBuilder().setCustomId('paper').setLabel('Paper').setStyle(ButtonStyle.Secondary).setEmoji('📄'), new ButtonBuilder().setCustomId('scissors').setLabel('Scissors').setStyle(ButtonStyle.Secondary).setEmoji('✂️'));
            const gameMessage = await interaction.reply({ embeds: [gameEmbed], components: [gameRow] });
            
            const collector = gameMessage.createMessageComponentCollector({ filter: i => i.user.id === challenger.id, time: 60000 });

            collector.on('collect', async i => {
                collector.stop();
                const playerChoice = i.customId;
                const botChoices = ['rock', 'paper', 'scissors'];
                const botChoice = botChoices[Math.floor(Math.random() * botChoices.length)];
                
                // --- THIS RESULT LINE IS NOW FIXED ---
                let resultText = `You chose ${playerChoice} ${emojiMap[playerChoice]}\nI chose ${botChoice} ${emojiMap[botChoice]}\n\n`;

                if (playerChoice === botChoice) resultText += "It's a tie!";
                else if ((playerChoice === 'rock' && botChoice === 'scissors') || (playerChoice === 'paper' && botChoice === 'rock') || (playerChoice === 'scissors' && botChoice === 'paper')) resultText += `🎉 You win!`;
                else resultText += `😔 I win! Better luck next time.`;
                
                const resultEmbed = new EmbedBuilder().setTitle('Game Over!').setDescription(resultText);
                await i.update({ embeds: [resultEmbed], components: [] });
            });
            collector.on('end', (collected, reason) => { if (reason === 'time' && collected.size === 0) interaction.editReply({ content: 'The game timed out because you did not make a choice.', embeds: [], components: [] }); });
        }
    },
};