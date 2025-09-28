const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

const kickGifs = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGZzZGR6aHdxZmZ6NzM0NmI0ZWt1am10cnp5dTV2dDJ0dzJzcG50aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3V0j3ytFyGHqiV7W/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2Foc3R5NGU3MDdhbWx0NnFhdml0N3U0MmtwZHd2OGs2c3dtaXBpbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sU8v2Jk0nKuxG/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Zmb2N3cmFhOHJseHJ1Nmh0MnZ4MGh6eDJiN2N3ZnM4a3dxaDN6cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7DzlajZWeXQ08/giphy.gif',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Select a member and kick them from the server.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id);

        if (!member) {
            return interaction.reply({ content: 'That user is not in this server.', flags: [MessageFlags.Ephemeral] });
        }
        if (!member.kickable) {
            return interaction.reply({ content: "I cannot kick this user! They may have a higher role than me or I don't have kick permissions.", flags: [MessageFlags.Ephemeral] });
        }

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_kick')
            .setLabel('Confirm Kick')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('💥');

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_kick')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('✖️');
        
        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const confirmationEmbed = new EmbedBuilder()
            .setColor('#f0ad4e')
            .setTitle('Kick Confirmation')
            .setDescription(`Are you sure you want to kick **${target.tag}** for the reason: *${reason}*?`)
            .setThumbnail(target.displayAvatarURL());

        const confirmationMessage = await interaction.reply({
            embeds: [confirmationEmbed],
            components: [row],
            flags: [MessageFlags.Ephemeral], // This is the main change
        });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async i => {
            row.components.forEach(c => c.setDisabled(true));
            await i.update({ components: [row] });

            if (i.customId === 'confirm_kick') {
                try {
                    await target.send(`You have been kicked from **${interaction.guild.name}** for the following reason: ${reason}`);
                } catch (error) {
                    console.warn(`Could not send DM to ${target.tag}.`);
                }

                await member.kick(reason);

                const kickEmbed = new EmbedBuilder()
                    .setColor('#ff4500')
                    .setTitle('Hasta La Vista, Baby!')
                    .setDescription(`**${target.tag}** has been kicked from the server.`)
                    .addFields({ name: 'Reason', value: reason })
                    .setImage(kickGifs[Math.floor(Math.random() * kickGifs.length)])
                    .setTimestamp()
                    .setFooter({ text: `Kicked by ${interaction.user.tag}` });
                
                await interaction.channel.send({ embeds: [kickEmbed] });
            }

            if (i.customId === 'cancel_kick') {
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#5cb85c')
                    .setTitle('Kick Cancelled')
                    .setDescription(`The kick against **${target.tag}** has been cancelled.`);
                await i.editReply({ embeds: [cancelEmbed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                row.components.forEach(c => c.setDisabled(true));
                interaction.editReply({
                    content: 'Confirmation timed out. The user has not been kicked.',
                    components: [row],
                    embeds: [],
                });
            }
        });
    },
};