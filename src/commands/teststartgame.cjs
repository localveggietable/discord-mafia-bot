const {SlashCommandBuilder} = require("@discordjs/builders");
const {setupGuild} = require("../util/setupGuild.cjs");
const {addPlayerToGame} = require("../util/addPlayerToGame.cjs");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("teststartgame")
    .setDescription("For testing purposes.")
    ,
    async execute(client, interaction){

        //do a regex match of interaction.channel.name
        const channelName = interaction.channel.name;
        if (!(new RegExp("^tos-channel(-[1-9])?$").test(channelName))){
            return interaction.followUp("A game can only be played on a channel with a name matching the format \"tos-channel\" or \"tos-channel-[n]\", where n is a positive integer between 1 and 9.");
        }
        const channelNumber = channelName.split("-").length == 2 ? 0 : +channelName.split("-")[2];
        if (client.games.get(interaction.guildId)?.get(channelNumber).ongoing){
            return interaction.followUp("A game has already started on this channel! You must wait for the game to end or expire, or create a game on a new channel"); 
        } 

        //SHOULD ACTUALLY ONLY DO THIS IF NO GAMES ARE CURRRENLTY PRESENT.
        
        interaction.guild.roles.cache.filter(r => r.name == "Alive Town Member" || r.name == "Dead Town Member").forEach(r => r.delete());
        interaction.guild.channels.cache.filter(c => c.name == "mafia-tos-channel" || c.name == "jailor-tos-channel" || c.name == "dead-tos-channel").forEach(c => c.delete());
    
        if(!client.games.get(interaction.guildId)) setupGuild(client, interaction.guildId);
        client.games.get(interaction.guildId).get(channelNumber).ongoing = true;
    
        const playerArray = ["1010786782578745437", "1010788072817954947", "1010341528511729685", "366632118312501250", "1010781628819308594", "1010784214746144789", "1010783382097121360", "1010781331023728671", "1010781078128164964", "1010780064620744775", "763972853640593449", "1010779481742516294", "1010779149369094244", "661747871871139890", "998857368613961838"];

        for (const playerID of playerArray){
            addPlayerToGame(client, interaction.guildId, channelNumber, playerID);
        }

        interaction.followUp("A game has successfully been started.");

        if(client.games.get(interaction.guildId).get(channelNumber).players.length == 15){
            await interaction.followUp(`Enough players have joined! The game will start automatically in 15 seconds.`);
            return client.emit("startGame", interaction.guildId, channelNumber);
        }
    }
};


