const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Search for stats of a minecraft server.')
        .addStringOption(option =>
            option.setName('ip')
            .setDescription('Search by ip.')
            .setRequired(true)),
	async execute(interaction) {
        let response = await interaction.client.fetch("https://api.mcstatus.io/v2/status/java/" + interaction.options.getString('ip'));

        if(!response) {
            return await interaction.reply("Couldn't find a server!");
        }

        let message = "**Host:** " + response.host + "\n**Motd:** " + (response.online ? response.motd.clean : "None") + "\n**Online:** " + (response.online ? "true" : "false") + "\n**Players [" + (response.online ? response.players.online : 0) + "/" + (response.online ? response.players.max : 0) + "]:** ";

        if(response.online) {
            response.players.list.forEach((player, index) => {
                if(index == 0) {
                    message += player.name_clean
                } else {
                    message += player.name_clean + ","
                }
            });
        }

        let embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setDescription(message)
        .setTimestamp();

        await interaction.reply({ embeds: [embed] });
	},
};