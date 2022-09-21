const {SlashCommandBuilder} = require("@discordjs/builders");
const {setupGuild} = require("../util/setupGuild.cjs");
const {addPlayerToGame} = require("../util/addPlayerToGame.cjs");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("startgame")
    .setDescription("Start a game of tos! (By default, the user who runs this command joins the game).")
    .addBooleanOption(option => 
        option.setName("autojoin")
            .setDescription("Sets whether or not the user invoking this command automatically joins the game")
            .setRequired(false))
    ,
    async execute(client, interaction, params){

        if (interaction.guild.roles.cache.find(r => r.name == "Alive Town Member" || r.name == "Dead Town Member")){
            return interaction.followUp("You currently have either/both \"Alive Town Member\" or \"Dead Town Member\" defined as a server role. Delete the role(s) or change their name(s) to continue.");
        }
        //do a regex match of interaction.channel.name
        const channelName = interaction.channel.name;
        if (!(new RegExp("^tos-channel(-[1-9])?$").test(channelName))){
            return interaction.followUp("A game can only be played on a channel with a name matching the format \"tos-channel\" or \"tos-channel-[n]\", where n is a positive integer between 1 and 9.");
        }
        const channelNumber = channelName.split("-").length == 2 ? 0 : +channelName.split("-")[2];
        if (client.games.get(interaction.guildId)?.get(channelNumber).ongoing){
            return interaction.followUp("A game has already started on this channel! You must wait for the game to end or expire, or create a game on a new channel"); 
        } 
    
        if(!client.games.get(interaction.guildId)) setupGuild(client, interaction.guildId);
        client.games.get(interaction.guildId).get(channelNumber).ongoing = true;

        console.log(interaction.member.id);
    
        if (params[0] === false) return interaction.followUp("A game has successfully been started, but you have not joined it.");
        addPlayerToGame(client, interaction.guildId, channelNumber, interaction.member.id);

        return interaction.followUp("A game has successfully been started.");
    }
};


