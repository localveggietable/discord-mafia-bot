const {SlashCommandBuilder} = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("tos-ping")
    .setDescription("Measures the websocket ping")
    ,
    async execute(client, interaction, params){
        await interaction.followUp({content: `Pong! (${client.ws.ping})`, ephemeral: true});
    }
};