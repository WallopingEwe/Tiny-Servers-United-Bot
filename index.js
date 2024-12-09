const { Client, GatewayIntentBits, PermissionsBitField, Collection, REST, Routes, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder  } = require('discord.js');
const path = require('path');
const fs = require("fs");
const axios = require('axios');
require('dotenv').config();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const token = process.env.DISCORD_BOT_TOKEN;const { QuickDB } = require("quick.db");
const ConsoleCache = {};

client.db = new QuickDB();
client.commands = new Collection();
client.commands.jsonArray = [];

const instance = axios.create({
    baseURL: 'https://services.redfog18.com:25560', // https://services.redfog18.com:25560
	timeout: 2000,
    httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false,
    }),
});

// Maybe eventually use this to handle api limits or whatever idk im doing this just in case i have to
client.fetch = async function(url, headers) {
  try {
    let response = await instance.get(url, headers);
    return response.data
  } catch (error) {
    return null;
  }
}

client.post = async function(url, data, headers) {
	try {
	  let response = await instance.post(url, data, headers);
	  return response.data
	} catch (error) {
	  return null;
	}
}

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
			client.commands.jsonArray.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(token);
(async () => {
	try {
		console.log(`Started refreshing ${client.commands.size} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands("1287727901931868170", "276150986391814146"),
			{ body: client.commands.jsonArray },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
	if(message.author.bot) { 
		return
	}

	let server = await client.db.get(`tracking.${message.guild.id}`)

	if(server.api_key && server.channels) {
		let chat_channel = server.channels.find(c => c.chat_channel === message.channel.id)
		let console_channel = server.channels.find(c => c.console_channel === message.channel.id)

		if(chat_channel) {
			await client.post(`/api/v2/servers/execute/command`, {
				"serverIds": [
					chat_channel.uuid
				],
				"command": "say " + `[${message.member.displayName}]: ` + message.content,
				}, 
				{
					headers: {
						apiKey: server.api_key,
					}
				}
			);

		} else if(console_channel) {			
			let response = await client.post(`/api/v2/servers/execute/command`, {
				"serverIds": [
					console_channel.uuid
				],
				"command": message.content,
				}, 
				{
					headers: {
						apiKey: server.api_key,
					}
				}
			);

			if(response == null) {
				message.reply("Command failed!")
			} else {
				message.reply("Command sent!")
			}
		}
	}
});

client.on("interactionCreate", async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on('interactionCreate', async interaction => {

	if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
		return;
	}

    if (interaction.isStringSelectMenu()) {
		if (interaction.customId === 'settings-menu') {
			let selectedSetting = interaction.values[0];

			let modal = new ModalBuilder()
			.setCustomId(`settings-modal-${selectedSetting}`)
			.setTitle('Update Setting');

			switch(selectedSetting) {
				case "api_key": {
					let row = new ActionRowBuilder();

					let input = new TextInputBuilder()
					.setCustomId('setting-input')
					.setRequired(true)
					.setLabel('Enter the API key:')
					.setPlaceholder('')
					.setStyle(TextInputStyle.Short)
					
					row.addComponents(input);
					
					modal.addComponents(row);
					break;
				}
				case "channels_add":
					let row = new ActionRowBuilder();
					let row2 = new ActionRowBuilder();
					let row3 = new ActionRowBuilder();
					let row4 = new ActionRowBuilder();
					let row5 = new ActionRowBuilder();

					let input = new TextInputBuilder()
					.setCustomId('setting-input')
					.setRequired(true)
					.setLabel('Enter the server name:')
					.setPlaceholder('')
					.setStyle(TextInputStyle.Short)

					let input2 = new TextInputBuilder()
					.setCustomId('setting-input2')
					.setRequired(true)
					.setLabel('Enter the chat channel id:')
					.setPlaceholder('')
					.setStyle(TextInputStyle.Short)

					let input3 = new TextInputBuilder()
					.setCustomId('setting-input3')
					.setRequired(true)
					.setLabel('Enter the console channel id:')
					.setPlaceholder('')
					.setStyle(TextInputStyle.Short)

					let input4 = new TextInputBuilder()
					.setCustomId('setting-input4')
					.setRequired(true)
					.setLabel('Enter the status channel id:')
					.setPlaceholder('')
					.setStyle(TextInputStyle.Short)

					let input5 = new TextInputBuilder()
					.setCustomId('setting-input5')
					.setRequired(true)
					.setLabel('Enter a link to your server logo. (PNG ONLY!)')
					.setPlaceholder('')
					.setStyle(TextInputStyle.Short)

					row.addComponents(input);
					row2.addComponents(input2);
					row3.addComponents(input3);
					row4.addComponents(input4);
					row5.addComponents(input5);

					modal.addComponents(row);
					modal.addComponents(row2);
					modal.addComponents(row3);
					modal.addComponents(row4);
					modal.addComponents(row5);

					break;
				case "channels_remove": {
					let row = new ActionRowBuilder();

					let input = new TextInputBuilder()
					.setCustomId('setting-input')
					.setRequired(true)
					.setLabel('Enter the server name:')
					.setPlaceholder('')
					.setStyle(TextInputStyle.Short)

					row.addComponents(input);
			
					modal.addComponents(row);
					break;
				}
			}

			await interaction.showModal(modal);
		}
	}
	
	if (interaction.isModalSubmit()) {

		if (interaction.customId.startsWith('settings-modal-')) {
			let selectedSetting = interaction.customId.split('-')[2];
			
			switch(selectedSetting) {
				case "api_key": {

					let apiKey = interaction.fields.getTextInputValue('setting-input');

					let response = await client.fetch("/api/v2", {
						headers: {
							apiKey: apiKey,
						}
					});

					if(!response) {
						return await interaction.reply({content: "Invalid API key!", ephemeral: true})
					}

					await client.db.set(`tracking.${interaction.guild.id}.api_key`, apiKey);
					await interaction.reply({content: "API Key added!", ephemeral: true})
					break;
				}
				case "channels_add": {
					let serverName = interaction.fields.getTextInputValue('setting-input');
					let chanChannelId = interaction.fields.getTextInputValue('setting-input2');
					let consoleChannelId = interaction.fields.getTextInputValue('setting-input3');
					let statusChannelId = interaction.fields.getTextInputValue('setting-input4');
					let pngUrl = interaction.fields.getTextInputValue('setting-input5');

					let channels = await client.db.get(`tracking.${interaction.guild.id}.channels`) || [];
					let channel = interaction.guild.channels.cache.get(chanChannelId)
					let channel2 = interaction.guild.channels.cache.get(consoleChannelId)
					let channel3 = interaction.guild.channels.cache.get(statusChannelId)
					let apiKey = await client.db.get(`tracking.${interaction.guild.id}.api_key`)
						
					if(channels.some(channel => channel.name === serverName)) {
						return await interaction.reply({content: "That server is already being tracked!", ephemeral: true});
					} else if(!channel) {
						return await interaction.reply({content: "The channel for the chat doesn't exist!", ephemeral: true});
					} else if(!channel2) {
						return await interaction.reply({content: "The channel for the console doesn't exist!", ephemeral: true});
					} else if(!channel3) {
						return await interaction.reply({content: "The channel for the server status doesn't exist!", ephemeral: true});
					} else if(channels.some(c => c.chat_channel === channel.id)) {
						return await interaction.reply({content: "The channel for the chat is already used for tracking!", ephemeral: true});
					} else if(channels.some(c => c.console_channel === channel2.id)) {
						return await interaction.reply({content: "The channel for the console is already used for tracking!", ephemeral: true});
					} else if (!channel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)) {
						return await interaction.reply({content: "I don't have permission to send messages in that channel!", ephemeral: true});
					} else if(!pngUrl.includes('.png')) {
						return await interaction.reply({content: "The url you sent is not a png!", ephemeral: true});
					} else if(!apiKey) {
						return await interaction.reply({content: "You need to set up an API key!", ephemeral: true});
					}

					let png = await client.fetch(pngUrl, { responseType: 'arraybuffer' });

					if(!png) {
						return await interaction.reply({content: "The url you sent is not a png!", ephemeral: true});
					}

    				let buffer = Buffer.from(png);

    				let pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    
    				let isPNG = pngSignature.every((byte, index) => byte === buffer[index]);

    				if (!isPNG) {
						return await interaction.reply({content: "The url you sent is not a png!", ephemeral: true});
    				}

					let response = await client.fetch("/api/v2/servers", {
						headers: {
							apiKey: apiKey,
						}
					});
				
					if(!response) {
						return await interaction.reply({content: "No access!", ephemeral: true})
					}

					let server = response.find(server => server.name.toLowerCase() === serverName.toLowerCase())
					if(!server) {
						return await interaction.reply({content: "That server doesn't exist!", ephemeral: true})
					}

					await client.db.push(`tracking.${interaction.guild.id}.channels`, {name: server.name, uuid: server.serverId, chat_channel: chatChannelId, console_channel: consoleChannelId, status_channel: statusChannelId, thumbnail: pngUrl});
					await interaction.reply({content: "Server tracking added!", ephemeral: true})
					break;
				}
				case "channels_remove": {
					
					let serverName = interaction.fields.getTextInputValue('setting-input');
					let channels = await client.db.get(`tracking.${interaction.guild.id}.channels`) || [];

					if(!channels.some(channel => channel.name.toLowerCase() === serverName.toLowerCase())) {
						return await interaction.reply({content: "That server doesn't exist!", ephemeral: true});
					}

					channels = channels.filter(channel => channel.name.toLowerCase() !== serverName.toLowerCase());

					await client.db.set(`tracking.${interaction.guild.id}.channels`, channels);
					await interaction.reply({content: "Server tracking removed!", ephemeral: true})
					break;
				}
			}
		}
	}
});

setInterval(async () => {
    let servers = await client.db.get("tracking") || {};

    for (let [guildId, value] of Object.entries(servers)) {
		if(!value.channels) {
			continue;
		}

        for (let server of value.channels) {
            try {
                let response = await client.fetch(`/api/v2/servers/${server.uuid}/console?amountOfLines=20`, {
                    headers: { apiKey: value.api_key },
                });

                if (response) {
                    let previousLines = ConsoleCache[server.uuid] || [];
                    let newLines = response.filter(line => !previousLines.includes(line));

                    ConsoleCache[server.uuid] = response;

					let chat_message = ""
					let currentChunk = "";
					let console_messages = []
                    newLines.forEach(line => {

						let console_line = line;
						let timestamp = ""
						let time = console_line.match(/\[([^\]]+)\]/);

						if(time) {
							console_line = console_line.substring(time[0].length + 1).trim();
							timestamp = `\u001b[0;31m${time[0]}\u001b[0;0m`
						}
						
						let count = 0;
						console_line = console_line.replace(/\[.*?\]/g, match => {
							if (count < 2) {
								count++;
								return `\u001b[0;34m${match}\u001b[0;0m`;
							}
							return match;
						});
					
						let formattedLine = `${timestamp} ${console_line}\n`;
						
						if (currentChunk.length + formattedLine.length > 2000) {
							console_messages.push(currentChunk.trim());
							currentChunk = "";
						}
					
						currentChunk += formattedLine;

						if(line.includes("[Server thread/INFO] [minecraft/MinecraftServer]")) {

							let timestamp = `\u001b[0;31m[${line.match(/\[([^\]]+)\]/)[1]}]\u001b[0;0m `;

							if(line.includes("[Not Secure]")) {
								let pointer = line.indexOf("[Not Secure]") + "[Not Secure]".length;
								line = line.substring(pointer).trim();
								line = line.replace(/\[.*?\]/, match => `\u001b[0;34m${match}\u001b[0;0m`);
							} else {
								let pointer = line.indexOf("[Server thread/INFO] [minecraft/MinecraftServer]:") + "[Server thread/INFO] [minecraft/MinecraftServer]:".length;
								line = line.substring(pointer).trim();

								if(line.includes('[Server]')) {
									line = line.replace(/\[.*?\]/, match => `\u001b[0;34m${match}\u001b[0;0m`);
								} else {
									let is_match = false
									line = line.replace(/\<.*?\>/, match => {
										is_match = true
										return `\u001b[0;34m[${match.slice(1, -1)}]\u001b[0;0m`;
									});

									if(!is_match) {
										return
									}
								}
							}
							
							chat_message += timestamp + line + "\n"
						}
                    });

					if(chat_message.length > 0) {
						let guild = await client.guilds.cache.get(guildId)
						let channel = await guild.channels.cache.get(server.chat_channel)
						
						if(channel) {
							await channel.send("\`\`\`ansi\n" + chat_message + "\`\`\`").catch(() => {})
						}
					}

					if (currentChunk.trim().length > 0) {
						console_messages.push(currentChunk.trim());
					}

					if(console_messages.length > 0) {
						let guild = await client.guilds.cache.get(guildId)
						let channel = await guild.channels.cache.get(server.console_channel)
						
						if(channel) {
							console_messages.forEach(async (console_message) => {
								await channel.send("\`\`\`ansi\n" + console_message + "\`\`\`").catch(() => {})
							});
						}
					}
                }
            } catch (error) {
                console.error(`Error fetching console lines for server ${server.uuid}:`, error);
            }
        }
    }
}, 10000);

setInterval(async () => {
    let servers = await client.db.get("tracking") || {};

    for (let [guildId, value] of Object.entries(servers)) {
		if(!value.channels) {
			continue;
		}

		for (let server of value.channels) {
			if(server.status_channel) {
				let guild = await client.guilds.cache.get(guildId)
				let channel = await guild.channels.cache.get(server.status_channel)

				if(channel) {
					let statusEmbed
					if(server.status_embed) {
						statusEmbed = await channel.messages.fetch(server.status_embed).catch(() => {})
					} else {
						statusEmbed = null
					}

					let response = await client.fetch(`/api/v2/servers/${server.uuid}`, {
						headers: {
							apiKey: value.api_key,
						}
					});

					let response2 = await client.fetch(`/api/v2/servers/${server.uuid}/stats`, {
						headers: {
							apiKey: value.api_key,
						}
					});
				
					if(!response || !response2) {
						return
					}

					let status;
					let color;
					switch(response.status) {
						case 0:
							status = "Offline"
							color = 0xff0000
							break;
						case 1:
							status = "Online"
							color = 0x00ff00
							break;
						case 2:
							status = "Restarting"
							color = 0xff9900
							break;
						case 3:
							status = "Starting"
							color = 0xff9900
							break;
						default:
							status = "Stopping"
							color = 0xff9900
							break;
					}
					
					let embed = new EmbedBuilder()
            		.setColor(color)
            		.setTitle(response.name)
					.setThumbnail(server.thumbnail)
					.setDescription(`**Status**: \`${status}\`\n**Players**: \`${response2.latest.playersOnline}/${response2.latest.playerLimit}\`\n**Start Time**: <t:${response2.latest.startDate}:t>`)
            		.setTimestamp();

					if(statusEmbed) {
						await statusEmbed.edit({embeds: [embed]}).catch(() => {})
					} else {
						await channel.send({embeds: [embed]}).then(async (newStatusEmbed) => {
							let channels = value.channels || [];
							
							let serverIndex = channels.findIndex((s) => s.uuid === server.uuid);
					
							if (serverIndex !== -1) {
								channels[serverIndex].status_embed = newStatusEmbed.id;
					
								await client.db.set(`tracking.${guildId}.channels`, channels);
							}
						}).catch(() => {});
					}
				}
			}
		}
	}
}, 60000);




client.login(token);