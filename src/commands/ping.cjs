const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("tos-ping")
    .setDescription("Measures the websocket ping.")
    ,
    async execute(client, interaction, params){
        await interaction.guild.roles.create({
            name: "Alive Town Member",
            color: "ORANGE"
        });
    
        let aliveRole = interaction.guild.roles.cache.find(r => r.name == "Alive Town Member");
        await interaction.member.roles.add(aliveRole);

        const outputChannel = interaction.guild.channels.cache.find((channel) => {return channel.name == "tos-channel"});
        await outputChannel.permissionOverwrites.edit(aliveRole, {SEND_MESSAGES: false});

        interaction.followUp({content: `Pong! (${client.ws.ping})`, ephemeral: true});
    }
};