const {SlashCommandBuilder, inlineCode} = require("@discordjs/builders");
const {addPlayerToGame} = require("../util/addPlayerToGame.cjs");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("joingame")
    .setDescription("Join an existing game of tos."),
    async execute(client, interaction){
        const channelName = interaction.channel.name;
        if (!(new RegExp("^tos-channel(-[1-9])?$").test(channelName))){
            return interaction.followUp("A game can only be played on a channel with a name matching the format \"tos-channel\" or \"tos-channel-[n]\", where n is a positive integer between 1 and 9.");
        }
        const channelNumber = channelName.split("-").length == 2 ? 0 : +channelName.split("-")[2]; 
    
        if(!client.games.get(interaction.guildId).get(channelNumber).ongoing){
            return interaction.followUp(`No game has been started yet! To start a game, use the ${inlineCode("/startgame")} command.`);
        }
    
        if(client.games.get(interaction.guildId).get(channelNumber).players.find((playerId) => {return playerId == interaction.user.id})){
            return interaction.followUp(`You've already joined this game!`);
        }
    
        addPlayerToGame(client, interaction.guildId, channelNumber, interaction.member.id);
        if(client.games.get(interaction.guildId).get(channelNumber).players.length == 15){
            await interaction.followUp(`Enough players have joined! The game will start automatically in 15 seconds. To start the game now, enter the command ${inlineCode("/startNow")}.`);
            return client.emit("startGame", interaction.guildId, channelNumber);
        }

        return interaction.followUp("You have successfully joined the game.");
    } 
};


