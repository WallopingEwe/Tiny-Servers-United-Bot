const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Change a setting for this server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('settings-menu')
            .setPlaceholder('Choose a setting to change...')
            .addOptions([
                { label: 'API Key', value: 'api_key', description: 'Input an API key created from the MCSS panel.' },
				{ label: 'Track Server', value: 'channels_add', description: 'Add message tracking for a server.' },
				{ label: 'Untrack Server', value: 'channels_remove', description: 'Remove message tracking for a server.' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Select the setting you want to change:',
            components: [row],
            ephemeral: true,
        });
    },
};