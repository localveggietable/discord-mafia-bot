const {SlashCommandBuilder} = require("@discordjs/builders");
const removePlayerFromGame = require("../util/removePlayerFromGame.cjs");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("leavegame")
    .setDescription("Leave a game of tos"),
    async execute(client, interaction, params){
        const channelName = interaction.channel.name;
        if (!(new RegExp("^tos-channel(-[1-9])?$").test(channelName))){
            return interaction.followUp("A game can only be played on a channel with a name matching the format \"tos-channel\" or \"tos-channel-[n]\", where n is a positive integer between 1 and 9.");
        }
        const channelNumber = channelName.split("-").length == 2 ? 0 : +channelName.split("-")[2]; 
    
        if(!client.games.get(interaction.guildID).get(channelNumber).ongoing){
            return interaction.followUp(`No game has been started yet!`);
        }
    
        if(!client.games.get(interaction.guildID).get(channelNumber).players.filter((player) => {player.id == interaction.member.id}).length){
            return interaction.followUp(`You're not in this game!`);
        }
    
        removePlayerFromGame(client, interaction.guildID, channelNumber, interaction.member.id);
    }
};

