const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("tos-ping")
    .setDescription("Measures the websocket ping.")
    ,
    async execute(client, interaction, params){

        let row = new MessageActionRow()
        .addComponents(

            new MessageButton()
            .setCustomId(1 + "")
            .setLabel("Not Guilty")
            .setStyle("PRIMARY"),

            new MessageButton()
            .setCustomId(2 + "")
            .setLabel("Guilty")
            .setStyle("PRIMARY")

        ); 


        interaction.followUp({content: `Pong! (${client.ws.ping})`, ephemeral: true});
        const rows = [row];

        await interaction.channel.send({
            content: "Vote!",
            components: [row]
        });

        await interaction.channel.send({
            content: "Vote!",
            components: [row]
        });
    }
};

/*

await interaction.guild.roles.create({
    name: "Alive Town Member",
    color: "ORANGE"
});

let aliveRole = interaction.guild.roles.cache.find(r => r.name == "Alive Town Member");
await interaction.member.roles.add(aliveRole);

const outputChannel = interaction.guild.channels.cache.find((channel) => {return channel.name == "tos-channel"});
await outputChannel.permissionOverwrites.edit(aliveRole, {SEND_MESSAGES: false});

*/