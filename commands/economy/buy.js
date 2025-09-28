const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { items } = require('../../shopItems');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item from the shop.')
        .addStringOption(option =>
            option
                .setName('item')
                .setDescription('The item you want to purchase')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const choices = items.map(item => ({ name: item.name, value: item.id }));
        const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedValue.toLowerCase()));
        await interaction.respond(filtered.slice(0, 25));
    },

    async execute(interaction) {
        const itemId = interaction.options.getString('item');
        const selectedItem = items.find(item => item.id === itemId);

        if (!selectedItem) {
            return interaction.reply({ content: 'That item does not exist.', ephemeral: true });
        }

        const db = interaction.client.db;
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Check user's balance
        const userRow = db.prepare('SELECT balance FROM economy WHERE userId = ?').get(userId);
        const balance = userRow ? userRow.balance : 0;

        if (balance < selectedItem.price) {
            // V V V THIS IS THE UPDATED LINE V V V
            return interaction.reply({ content: `You don't have enough coins for this! You have **${balance} coins** but need **${selectedItem.price} coins**.`, ephemeral: true });
        }

        // Check if user already owns the item
        const inventoryRow = db.prepare('SELECT itemId FROM inventories WHERE userId = ? AND guildId = ? AND itemId = ?').get(userId, guildId, itemId);
        if (inventoryRow) {
            return interaction.reply({ content: 'You already own this item!', ephemeral: true });
        }
        
        // Begin transaction
        try {
            // Subtract cost from balance
            db.prepare('UPDATE economy SET balance = balance - ? WHERE userId = ?').run(selectedItem.price, userId);
            
            // Add item to inventory
            db.prepare('INSERT INTO inventories (userId, guildId, itemId) VALUES (?, ?, ?)').run(userId, guildId, selectedItem.id);

            // Give the role to the user
            const role = interaction.guild.roles.cache.get(selectedItem.roleId);
            if (role) {
                await interaction.member.roles.add(role);
            } else {
                console.error(`Role with ID ${selectedItem.roleId} not found.`);
            }

            await interaction.reply({ content: `Congratulations! You have successfully purchased the **${selectedItem.name}** role.` });

        } catch (error) {
            console.error('Failed to complete purchase transaction:', error);
            await interaction.reply({ content: 'Something went wrong with the purchase. Please contact an admin.', ephemeral: true });
        }
    },
};