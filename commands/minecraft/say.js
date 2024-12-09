const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Send a message to the server.')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('The server\'s name')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
            .setDescription('The message to send.')
            .setRequired(true)),    
	async execute(interaction) {
        let apiKey = await interaction.client.db.get(`tracking.${interaction.guild.id}.api_key`)

        if(!apiKey) {
            return await interaction.reply("You need to set up an API key!");
        }

        let response = await interaction.client.fetch("/api/v2/servers", {
            headers: {
                apiKey: apiKey,
            }
        });
    
        if(!response) {
            return await interaction.reply("No access!")
        }

        let server = response.find(server => server.name.toLowerCase() === interaction.options.getString('name').toLowerCase())
        if(!server) {
            return await interaction.reply("That server doesn't exist!")
        }

        let message = interaction.options.getString('message')

        response = await interaction.client.post(`/api/v2/servers/execute/command`, {
            "serverIds": [
                server.serverId
            ],
            "command": "say " + `[${interaction.member.displayName}]: ` + message,
            }, 
            {
                headers: {
                    apiKey: apiKey,
                }
            }
        );

        if(response == null) {
            return await interaction.reply("The message failed to send!");
        }

        await interaction.reply(`The message \`${message}\` was sent!`);
	},
};