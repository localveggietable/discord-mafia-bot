const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("tos-ping")
    .setDescription("Measures the websocket ping.")
    ,
    async execute(client, interaction){

        return interaction.followUp({content: `Pong! (${client.ws.ping}), in the guild ${interaction.guild.name}`, ephemeral: true});

    }
};