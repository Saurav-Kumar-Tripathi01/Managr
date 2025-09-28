const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // ==================================================
        // V V V      ADD THIS NEW BLOCK FOR AUTOCOMPLETE      V V V
        // ==================================================
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                // Check if the command has an autocomplete method before calling it
                if (command.autocomplete) {
                    await command.autocomplete(interaction);
                }
            } catch (error) {
                console.error(error);
            }
        }
        // ==================================================
        // Handle slash commands
        else if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: [ 64 ] });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: [ 64 ] });
                }
            }
        } 
        // Handle modal submissions
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'suggestionModal') {
                const title = interaction.fields.getTextInputValue('suggestionTitle');
                const details = interaction.fields.getTextInputValue('suggestionDetails');

                const suggestionEmbed = new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle(`New Suggestion: ${title}`)
                    .setDescription(details)
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();
                
                await interaction.reply({ content: '✅ Thank you, your suggestion has been submitted!', ephemeral: true });
                await interaction.channel.send({ embeds: [suggestionEmbed] });
            }
        }
    },
};