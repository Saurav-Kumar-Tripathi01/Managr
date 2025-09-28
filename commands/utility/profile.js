const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Displays a user\'s profile card with their level and balance.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user whose profile you want to see')),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('user') || interaction.user;
        const db = interaction.client.db;

        // Fetch user data from both tables
        const levelData = db.prepare('SELECT level, xp FROM levels WHERE guildId = ? AND userId = ?').get(interaction.guild.id, target.id);
        const economyData = db.prepare('SELECT balance FROM economy WHERE userId = ?').get(target.id);

        const level = levelData ? levelData.level : 0;
        const xp = levelData ? levelData.xp : 0;
        const balance = economyData ? economyData.balance : 0;
        const xpNeeded = 5 * (level ** 2) + 50 * level + 100;

        // Create a new canvas
        const canvas = Canvas.createCanvas(1000, 333);
        const ctx = canvas.getContext('2d');

        // Draw background
        ctx.fillStyle = '#23272A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw username
        ctx.fillStyle = '#ffffff';
        ctx.font = '60px sans-serif';
        ctx.fillText(target.username, 300, 130);

        // Draw level and balance text
        ctx.font = '40px sans-serif';
        ctx.fillStyle = '#B9BBBE';
        ctx.fillText(`Level: ${level}`, 300, 190);
        ctx.fillText(`Coins: ${balance} 🪙`, 600, 190);

        // Draw XP progress bar background
        ctx.fillStyle = '#484B4E';
        ctx.fillRect(300, 230, 650, 40);

        // Draw XP progress bar foreground
        const progress = Math.min(xp / xpNeeded, 1); // Ensure progress doesn't exceed 100%
        ctx.fillStyle = '#7289DA';
        ctx.fillRect(300, 230, 650 * progress, 40);

        // Draw XP text on the progress bar
        ctx.fillStyle = '#ffffff';
        ctx.font = '30px sans-serif';
        ctx.fillText(`${xp} / ${xpNeeded} XP`, 310, 260);

        // Draw user avatar (as a circle)
        ctx.save();
        ctx.beginPath();
        ctx.arc(160, 166, 110, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await Canvas.loadImage(target.displayAvatarURL({ extension: 'png' }));
        ctx.drawImage(avatar, 50, 56, 220, 220);
        ctx.restore();
        
        // Create the attachment and send the image
        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile-card.png' });
        await interaction.editReply({ files: [attachment] });
    },
};