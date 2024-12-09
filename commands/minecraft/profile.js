const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Search for a minecraft profile via username or uuid.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Search by username.'))
        .addStringOption(option =>
            option.setName('uuid')
            .setDescription('Search by uuid.')),
	async execute(interaction) {
        let username = interaction.options.getString('username');
        let uuid = interaction.options.getString('uuid');

        if(!username && !uuid) {
            return interaction.reply("You need to provide a username or uuid!")
        }

        let response;
        if(uuid) {
            response = await interaction.client.fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + uuid)
        } else {
            response = await interaction.client.fetch("https://api.mojang.com/users/profiles/minecraft/" + username)
            if(response && !response.error && !response.errorMessage) {
                response = await interaction.client.fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + response.id)
            }
        }

        if(!response || response.error || response.errorMessage) {
            return await interaction.reply("Couldn't find an account...");
        }

        let embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setThumbnail("https://crafatar.com/skins/" + response.id)
        .setDescription('**Username:** ' + response.name + "\n**Id:** " + response.id)
        .setTimestamp();

        await interaction.reply({ embeds: [embed] });
	},
};