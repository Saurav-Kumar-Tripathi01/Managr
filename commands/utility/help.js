const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // This file now exports two functions: `autocomplete` and `execute`
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get a list of all commands or info about a specific command.')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('The command you want help with')
                .setAutocomplete(true)), // Enable autocomplete for this option

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const commands = interaction.client.commands;
        
        // Filter commands based on the user's input
        const filtered = commands.filter(command => 
            command.data.name.startsWith(focusedValue)
        ).map(command => ({ name: command.data.name, value: command.data.name }));

        // Respond with the filtered choices
        await interaction.respond(filtered.slice(0, 25)); // Max 25 choices
    },

    async execute(interaction) {
        const commandName = interaction.options.getString('command');
        const commands = interaction.client.commands;
        const helpEmbed = new EmbedBuilder().setColor('#0099ff');

        if (!commandName) {
            // If no specific command is requested, list all commands
            helpEmbed
                .setTitle('All Available Commands')
                .setDescription('Here is a list of all my commands. Use `/help command:<name>` for more details on a specific one!');
            
            const commandList = commands.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n');
            helpEmbed.addFields({ name: 'Commands', value: commandList });

        } else {
            // If a specific command is requested, show its details
            const command = commands.get(commandName);

            if (!command) {
                return interaction.reply({ content: 'That command does not exist.', ephemeral: true });
            }

            helpEmbed
                .setTitle(`Help for: \`/${command.data.name}\``)
                .setDescription(command.data.description);
            
            // You can add more details here if your commands have them, like options
            if (command.data.options.length) {
                const optionsList = command.data.options.map(opt => `\`${opt.name}\`: ${opt.description}`).join('\n');
                helpEmbed.addFields({ name: 'Options', value: optionsList });
            }
        }

        await interaction.reply({ embeds: [helpEmbed] });
    },
};