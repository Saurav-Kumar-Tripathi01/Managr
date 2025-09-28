const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { items } = require('../../shopItems');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Check your or another user\'s purchased items.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user whose inventory you want to see')),
    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const db = interaction.client.db;

        const userItems = db.prepare('SELECT itemId FROM inventories WHERE userId = ? AND guildId = ?').all(target.id, interaction.guild.id);

        if (userItems.length === 0) {
            return interaction.reply({ content: `${target.username} does not own any items.`, ephemeral: true });
        }
        
        const inventoryList = userItems.map(row => {
            const itemDetails = items.find(item => item.id === row.itemId);
            return itemDetails ? `- ${itemDetails.name}` : '- *Unknown Item*';
        }).join('\n');
        
        const inventoryEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setAuthor({ name: `${target.username}'s Inventory`, iconURL: target.displayAvatarURL() })
            .setDescription(inventoryList);
            
        await interaction.reply({ embeds: [inventoryEmbed] });
    },
};