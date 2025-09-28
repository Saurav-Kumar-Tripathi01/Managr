const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { items } = require('../../shopItems');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Displays all items available for purchase.'),
    async execute(interaction) {
        if (items.length === 0) {
            return interaction.reply({ content: 'The shop is currently empty.', ephemeral: true });
        }

        const shopEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('Server Shop')
            .setDescription('Use `/buy <item>` to purchase an item!');

        items.forEach(item => {
            shopEmbed.addFields({
                name: `${item.name} - ${item.price} coins 🪙`,
                value: item.description,
            });
        });

        await interaction.reply({ embeds: [shopEmbed] });
    },
};