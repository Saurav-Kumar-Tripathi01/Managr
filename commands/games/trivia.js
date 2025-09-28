const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const { decode } = require('html-entities');

// Helper function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Starts a trivia game. First to answer correctly wins coins!'),
    async execute(interaction) {
        const TRIVIA_REWARD = 100;
        await interaction.deferReply();

        try {
            // Fetch a trivia question from the Open Trivia Database API
            const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = response.data.results[0];

            const question = decode(data.question);
            const category = decode(data.category);
            const correctAnswer = decode(data.correct_answer);
            const incorrectAnswers = data.incorrect_answers.map(a => decode(a));
            const allAnswers = shuffleArray([correctAnswer, ...incorrectAnswers]);

            const triviaEmbed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('🧠 Trivia Time! 🧠')
                .setDescription(`**Category:** ${category}\n\n**Question:**\n${question}`)
                .setFooter({ text: `First to answer correctly wins ${TRIVIA_REWARD} coins!` });
            
            const answerRow = new ActionRowBuilder();
            allAnswers.forEach(answer => {
                answerRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(answer) // Set the answer as the custom ID
                        .setLabel(answer)
                        .setStyle(ButtonStyle.Primary)
                );
            });

            const triviaMessage = await interaction.editReply({ embeds: [triviaEmbed], components: [answerRow] });
            
            const collector = triviaMessage.createMessageComponentCollector({
                filter: i => allAnswers.includes(i.customId), // Only collect clicks on our answer buttons
                time: 30000 // 30 seconds to answer
            });

            collector.on('collect', async i => {
                collector.stop(); // Stop listening once an answer is submitted
                
                // Disable all buttons
                answerRow.components.forEach(button => button.setDisabled(true));

                if (i.customId === correctAnswer) {
                    // Award coins to the winner
                    const db = i.client.db;
                    const stmt = db.prepare(`
                        INSERT INTO economy (userId, balance, lastDaily) VALUES (?, ?, 0)
                        ON CONFLICT(userId) DO UPDATE SET balance = balance + ?;
                    `);
                    stmt.run(i.user.id, TRIVIA_REWARD, TRIVIA_REWARD);
                    
                    await i.update({
                        content: `🎉 ${i.user} answered correctly and won **${TRIVIA_REWARD} coins**! The answer was: **${correctAnswer}**`,
                        embeds: [],
                        components: [answerRow]
                    });
                } else {
                    await i.update({
                        content: `😔 Sorry, ${i.user}, that was incorrect. The correct answer was: **${correctAnswer}**`,
                        embeds: [],
                        components: [answerRow]
                    });
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    answerRow.components.forEach(button => button.setDisabled(true));
                    interaction.editReply({
                        content: `Time's up! The correct answer was: **${correctAnswer}**`,
                        embeds: [],
                        components: [answerRow]
                    });
                }
            });

        } catch (error) {
            console.error('Trivia API Error:', error);
            await interaction.editReply({ content: 'Sorry, I couldn\'t fetch a trivia question right now.', ephemeral: true });
        }
    },
};