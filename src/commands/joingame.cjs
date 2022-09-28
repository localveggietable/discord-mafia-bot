const {SlashCommandBuilder, inlineCode} = require("@discordjs/builders");
const {addPlayerToGame} = require("../util/addPlayerToGame.cjs");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("joingame")
    .setDescription("Join an existing game of tos."),
    async execute(client, interaction){
        const channelName = interaction.channel.name;
        if (!(new RegExp("^tos-channel(-[1-9])?$").test(channelName))){
            return interaction.followUp({content: "A game can only be played on a channel with a name matching the format \"tos-channel\" or \"tos-channel-[n]\", where n is a positive integer between 1 and 9."});
        }
        const channelNumber = channelName.split("-").length == 2 ? 0 : +channelName.split("-")[2]; 
    
        if(!client.games.get(interaction.guildId).get(channelNumber).ongoing){
            return interaction.followUp({content: `No game has been started yet! To start a game, use the ${inlineCode("/startgame")} command.`});
        }

        if (client.gameUsers.get(interaction.user.id)){
            let [guildID, channelID] = client.gameUsers.get(interaction.user.id);

            if (interaction.guildId == guildID && channelNumber == channelID) return interaction.followUp({content: "You've already joined this game!"});
            if (interaction.guildId == guildID) return interaction.followUp({content: "You've already joined another game on this server!"});
            else interaction.followUp({content: "You've already joined a game on some other server!"});
        }
    
        addPlayerToGame(client, interaction.guildId, channelNumber, interaction.member.id);
        if(client.games.get(interaction.guildId).get(channelNumber).players.length == 15){
            await interaction.followUp("Enough players have joined! The game will start automatically in 15 seconds.");
            return client.emit("startGame", interaction.guildId, channelNumber);
        }

        return interaction.followUp("You have successfully joined the game.");
    } 
};


