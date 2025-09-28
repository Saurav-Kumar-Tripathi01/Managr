const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true, // This event should only run once
    execute(client) {
        console.log(`✅ Ready! Logged in as ${client.user.tag}`);
    },
};