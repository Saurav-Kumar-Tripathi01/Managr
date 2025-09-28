const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

// Function to create the button grid for the game board
function createBoard(boardState) {
    const rows = [];
    for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const index = i * 3 + j;
            const label = boardState[index];
            const button = new ButtonBuilder()
                .setCustomId(`tictactoe_${index}`)
                // V V V THIS IS THE LINE TO CHANGE V V V
                .setLabel(label === ' ' ? '\u200B' : label) // Use a zero-width space for empty cells
                .setStyle(label === 'X' ? ButtonStyle.Primary : (label === 'O' ? ButtonStyle.Danger : ButtonStyle.Secondary))
                .setDisabled(label !== ' ');
            row.addComponents(button);
        }
        rows.push(row);
    }
    return rows;
}

// Function to check for a winner
function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] !== ' ' && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Returns 'X' or 'O'
        }
    }
    return board.includes(' ') ? null : 'Tie'; // Returns null if game is ongoing, 'Tie' if it's a draw
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Challenge a user to a game of Tic-Tac-Toe.')
        .addUserOption(option =>
            option
                .setName('opponent')
                .setDescription('The user you want to play against')
                .setRequired(true)),
    async execute(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('opponent');

        if (opponent.bot) return interaction.reply({ content: "You can't play against a bot!", ephemeral: true });
        if (opponent.id === challenger.id) return interaction.reply({ content: "You can't play against yourself!", ephemeral: true });

        // --- Challenge Phase ---
        const challengeEmbed = new EmbedBuilder()
            .setTitle('Tic-Tac-Toe Challenge!')
            .setDescription(`${opponent}, you have been challenged to a game of Tic-Tac-Toe by ${challenger}. Do you accept?`);
        
        const challengeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('accept_ttt').setLabel('Accept').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('decline_ttt').setLabel('Decline').setStyle(ButtonStyle.Danger)
        );
        
        const challengeMessage = await interaction.reply({ embeds: [challengeEmbed], components: [challengeRow], content: `${opponent}` });
        
        const challengeCollector = challengeMessage.createMessageComponentCollector({
            filter: i => i.user.id === opponent.id,
            time: 60000 // 60 seconds to respond
        });

        challengeCollector.on('collect', async i => {
            challengeCollector.stop(); // Stop listening for more challenge responses
            if (i.customId === 'decline_ttt') {
                return i.update({ content: 'The challenge was declined.', embeds: [], components: [] });
            }

            // --- Game Phase ---
            let boardState = Array(9).fill(' ');
            let currentPlayer = 'X'; // X is the challenger
            let players = { 'X': challenger, 'O': opponent };
            let gameOver = false;

            const gameEmbed = new EmbedBuilder()
                .setTitle('Tic-Tac-Toe')
                .setDescription(`It's ${players[currentPlayer]}'s turn (**${currentPlayer}**).`);
                
            await i.update({ embeds: [gameEmbed], components: createBoard(boardState) });
            const gameMessage = await i.fetchReply();

            const gameCollector = gameMessage.createMessageComponentCollector({
                filter: btn => btn.user.id === players[currentPlayer].id,
                time: 300000 // 5 minutes per game
            });

            gameCollector.on('collect', async btn => {
                if (gameOver) return;

                const index = parseInt(btn.customId.split('_')[1]);
                boardState[index] = currentPlayer;

                const winner = checkWinner(boardState);
                if (winner) {
                    gameOver = true;
                    gameCollector.stop();
                    const finalEmbed = new EmbedBuilder().setTitle('Game Over!');
                    if (winner === 'Tie') {
                        finalEmbed.setDescription("It's a tie!");
                    } else {
                        finalEmbed.setDescription(`🎉 ${players[winner]} (${winner}) wins!`);
                    }
                    // Disable all buttons on game end
                    const finalBoard = createBoard(boardState);
                    finalBoard.forEach(row => row.components.forEach(button => button.setDisabled(true)));
                    return btn.update({ embeds: [finalEmbed], components: finalBoard });
                }

                // Switch player
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                const nextTurnEmbed = new EmbedBuilder()
                    .setTitle('Tic-Tac-Toe')
                    .setDescription(`It's ${players[currentPlayer]}'s turn (**${currentPlayer}**).`);

                btn.update({ embeds: [nextTurnEmbed], components: createBoard(boardState) });
            });

            gameCollector.on('end', (collected, reason) => {
                if (reason === 'time' && !gameOver) {
                    const timeoutEmbed = new EmbedBuilder().setTitle('Game Over!').setDescription('The game timed out because a player took too long.');
                    // Disable all buttons on timeout
                    const finalBoard = createBoard(boardState);
                    finalBoard.forEach(row => row.components.forEach(button => button.setDisabled(true)));
                    i.editReply({ embeds: [timeoutEmbed], components: finalBoard });
                }
            });
        });

        challengeCollector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                interaction.editReply({ content: 'The challenge expired.', embeds: [], components: [] });
            }
        });
    },
};