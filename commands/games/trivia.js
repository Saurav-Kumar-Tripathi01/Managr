const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
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
    cooldown: 20, // Add a longer cooldown for the quest
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Play a trivia game!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('single')
                .setDescription('Play a single trivia question for a small prize.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('quest')
                .setDescription('Start a 10-question trivia quest for a big prize!')),
    
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'single') {
            await handleSingleTrivia(interaction);
        } else if (interaction.options.getSubcommand() === 'quest') {
            await handleTriviaQuest(interaction);
        }
    },
};

// --- SINGLE TRIVIA LOGIC ---
async function handleSingleTrivia(interaction) {
    const TRIVIA_REWARD = 100;
    await interaction.deferReply();
    // ... (The rest of the single trivia logic is identical to your previous file)
    try {
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = response.data.results[0];
        const question = decode(data.question);
        const category = decode(data.category);
        const correctAnswer = decode(data.correct_answer);
        const incorrectAnswers = data.incorrect_answers.map(a => decode(a));
        const allAnswers = shuffleArray([correctAnswer, ...incorrectAnswers]);

        const triviaEmbed = new EmbedBuilder().setColor('#f1c40f').setTitle('🧠 Trivia Time! 🧠').setDescription(`**Category:** ${category}\n\n**Question:**\n${question}`).setFooter({ text: `First to answer correctly wins ${TRIVIA_REWARD} coins!` });
        const answerRow = new ActionRowBuilder();
        allAnswers.forEach(answer => { answerRow.addComponents(new ButtonBuilder().setCustomId(answer).setLabel(answer).setStyle(ButtonStyle.Primary)); });

        const triviaMessage = await interaction.editReply({ embeds: [triviaEmbed], components: [answerRow] });
        const collector = triviaMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async i => {
            collector.stop();
            answerRow.components.forEach(button => button.setDisabled(true));
            if (i.customId === correctAnswer) {
                const db = i.client.db;
                const stmt = db.prepare(`INSERT INTO economy (userId, balance, lastDaily) VALUES (?, ?, 0) ON CONFLICT(userId) DO UPDATE SET balance = balance + ?;`);
                stmt.run(i.user.id, TRIVIA_REWARD, TRIVIA_REWARD);
                await i.update({ content: `🎉 ${i.user} answered correctly and won **${TRIVIA_REWARD} coins**! The answer was: **${correctAnswer}**`, embeds: [], components: [answerRow] });
            } else {
                await i.update({ content: `😔 Sorry, ${i.user}, that was incorrect. The correct answer was: **${correctAnswer}**`, embeds: [], components: [answerRow] });
            }
        });
        collector.on('end', (collected, reason) => { if (reason === 'time' && collected.size === 0) { answerRow.components.forEach(button => button.setDisabled(true)); interaction.editReply({ content: `Time's up! The correct answer was: **${correctAnswer}**`, embeds: [], components: [answerRow] }); } });
    } catch (error) { console.error('Trivia API Error:', error); await interaction.editReply({ content: 'Sorry, I couldn\'t fetch a trivia question right now.', ephemeral: true }); }
}


// --- TRIVIA QUEST LOGIC ---
async function handleTriviaQuest(interaction) {
    await interaction.deferReply();
    const user = interaction.user;
    let score = 0;

    try {
        // Fetch 10 questions at once
        const response = await axios.get('https://opentdb.com/api.php?amount=10&type=multiple');
        const questions = response.data.results;

        await interaction.editReply({ content: `**Trivia Quest Started!**\nGet ready, ${user}, for 10 questions. You have 30 seconds for each.` });

        // Loop through each question
        for (let i = 0; i < questions.length; i++) {
            const data = questions[i];
            const question = decode(data.question);
            const category = decode(data.category);
            const correctAnswer = decode(data.correct_answer);
            const incorrectAnswers = data.incorrect_answers.map(a => decode(a));
            const allAnswers = shuffleArray([correctAnswer, ...incorrectAnswers]);

            const questionEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle(`Question ${i + 1} of 10`)
                .setDescription(`**Category:** ${category}\n\n**Question:**\n${question}`)
                .setFooter({ text: `Current Score: ${score}` });

            const answerRow = new ActionRowBuilder();
            allAnswers.forEach(answer => { answerRow.addComponents(new ButtonBuilder().setCustomId(answer).setLabel(answer).setStyle(ButtonStyle.Primary)); });

            const questionMessage = await interaction.followUp({ embeds: [questionEmbed], components: [answerRow], fetchReply: true });

            try {
                // Wait for the user who started the quest to answer
                const filter = (i) => i.user.id === user.id;
                const collected = await questionMessage.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 30000 });

                answerRow.components.forEach(button => {
                    button.setDisabled(true);
                    if (button.data.custom_id === correctAnswer) button.setStyle(ButtonStyle.Success);
                    else if (button.data.custom_id === collected.customId) button.setStyle(ButtonStyle.Danger);
                });

                if (collected.customId === correctAnswer) {
                    score++;
                    await collected.update({ content: '✅ Correct!', embeds: [questionEmbed], components: [answerRow] });
                } else {
                    await collected.update({ content: '❌ Wrong Answer!', embeds: [questionEmbed], components: [answerRow] });
                }

            } catch (error) {
                // Handle timeout
                answerRow.components.forEach(button => {
                    button.setDisabled(true);
                    if (button.data.custom_id === correctAnswer) button.setStyle(ButtonStyle.Success);
                });
                await interaction.editReply({ content: "Time's up! Here's the correct answer.", embeds: [questionEmbed], components: [answerRow] });
            }
             // Pause for a moment before the next question
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // --- Quest End ---
        const finalScore = score * 150; // e.g., 150 coins per correct answer
        const db = interaction.client.db;
        const stmt = db.prepare(`INSERT INTO economy (userId, balance, lastDaily) VALUES (?, ?, 0) ON CONFLICT(userId) DO UPDATE SET balance = balance + ?;`);
        stmt.run(user.id, finalScore, finalScore);

        const finalEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('Trivia Quest Complete!')
            .setDescription(`${user}, you finished the quest with a score of **${score}/10**!\nYou have been awarded **${finalScore} coins** 🪙 for your knowledge!`)
            .setTimestamp();
        
        await interaction.followUp({ embeds: [finalEmbed] });

    } catch (error) {
        console.error('Trivia API Error:', error);
        await interaction.editReply({ content: 'Sorry, I couldn\'t fetch the trivia quest questions right now.', ephemeral: true });
    }
}