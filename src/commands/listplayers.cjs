const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("listplayers")
        .setDescription("List all the players in a game."),
    async execute(client, interaction){
        //do a regex match of interaction.channel.name
        const channelName = interaction.channel.name;
        if (!(new RegExp("^tos-channel(-[1-9])?$").test(channelName))){
            return interaction.followUp("You can't use that command here!");
        }
        const channelNumber = channelName.split("-").length == 2 ? 0 : +channelName.split("-")[2];

        if (!client.games.get(interaction.guildId)?.get(channelNumber).ongoing){
            return interaction.followUp("No game has started."); 
        }

        const toSend = client.games.get(interaction.guildId).get(channelNumber).players.length ? `The following players are in the game: ${client.games.get(interaction.guildId).get(channelNumber).players.map(playerID => client.users.cache.get(playerID).tag).join(", ")}`: "No players have been added to the game yet.";
        return interaction.followUp(toSend);
    }
}