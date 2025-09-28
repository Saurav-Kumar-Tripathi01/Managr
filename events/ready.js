const { Events, ActivityType } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`✅ Ready! Logged in as ${client.user.tag}`);

        // Array of status messages to cycle through
        const activities = [
            { name: 'Music 🎶', type: ActivityType.Listening },
            { name: 'Tic-Tac-Toe  Tic-Tac-Toe 🎲', type: ActivityType.Playing },
            { name: 'with your commands', type: ActivityType.Playing },
            { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching }
        ];

        // Update the bot's status every 15 seconds
        setInterval(() => {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            client.user.setActivity(activity.name, { type: activity.type });
        }, 15000); // 15 seconds in milliseconds
	},
};