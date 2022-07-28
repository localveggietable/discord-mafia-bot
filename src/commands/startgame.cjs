const {SlashCommandBuilder} = require("@discordjs/builders");
const {setupGuild} = require("../util/setupGuild.cjs");
const {addPlayerToGame} = require("../util/addPlayerToGame.cjs");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("tos-startgame")
    .setDescription("Start a game of tos! (By default, the user who runs this command joins the game)")
    .addBooleanOption(option => 
        option.setName("autojoin")
            .setDescription("Sets whether or not the user invoking this command automatically joins the game")
            .setRequired(false))
    ,
    execute: async function startGame(client, interaction, params){

        console.log("hi");
        //do a regex match of interaction.channel.name
        const channelName = interaction.channel.name;
        if (!(new RegExp("^tos-channel(-[1-9])?$").test(channelName))){
            return await interaction.followUp("A game can only be played on a channel with a name matching the format \"tos-channel\" or \"tos-channel-[n]\", where n is a positive integer between 1 and 9.");
        }
        const channelNumber = channelName.split("-").length == 2 ? 0 : +channelName.split("-")[2];
        if (client.games.get(interaction.guildID)?.get(channelNumber).ongoing){
            return await interaction.followUp("A game has already started on this channel! You must wait for the game to end or expire, or create a game on a new channel"); 
        } 
    
        if(!client.games.get(interaction.guildID)) await setupGuild(client, interaction.guildID);
        client.games.get(interaction.guildID).get(channelNumber).ongoing = true;
    
        if (!params[0]) return;
        addPlayerToGame(client, interaction.guildID, channelNumber, interaction.member.id);
    }
};


