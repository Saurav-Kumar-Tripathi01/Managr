const { Events, EmbedBuilder, Collection } = require('discord.js'); // Added Collection here

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle autocomplete interactions
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                if (command.autocomplete) {
                    await command.autocomplete(interaction);
                }
            } catch (error) {
                console.error(error);
            }
        }
        // Handle slash command interactions
        else if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            // ==================================================
            // V V V          COOLDOWN LOGIC STARTS         V V V
            // ==================================================
            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1000);
                    return interaction.reply({
                        content: `Please wait, you are on a cooldown for \`/${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                        ephemeral: true
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            // ==================================================
            // ^ ^ ^           COOLDOWN LOGIC ENDS          ^ ^ ^
            // ==================================================

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
                
                // Note: Updated this line to use flags for consistency
                await interaction.reply({ content: '✅ Thank you, your suggestion has been submitted!', flags: [ 64 ] });
                await interaction.channel.send({ embeds: [suggestionEmbed] });
            }
        }
    },
};