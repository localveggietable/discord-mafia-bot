const {SlashCommandBuilder} = require("@discordjs/builders");
const {setupGuild} = require("../util/setupGuild.js");
const {addPlayerToGame} = require("../util/addPlayerToGame.js");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("startgame")
    .setDescription("Start a game of tos! (By default, the user who runs this command joins the game).")
    .setDMPermission(false)
    .addBooleanOption(option => 
        option.setName("autojoin")
            .setDescription("Sets whether or not the user invoking this command automatically joins the game")
            .setRequired(false))
    ,
    async execute(client, interaction, params){
        if (["*", "_", "`", "\\"].some(char => interaction.member.displayName.includes(char))) return interaction.followUp("Sorry! You can't create a game if your nickname includes the characters ( * ), ( _ ), ( ` ), and/or ( / ). (*Please change your nickname before creating a game!*)");

        //do a regex match of interaction.channel.name
        const channelName = interaction.channel.name;
        if (!(new RegExp("^tos-channel(-[1-9])?$").test(channelName))){
            return interaction.followUp({content: "A game can only be played on a channel with a name matching the format \"tos-channel\" or \"tos-channel-[n]\", where n is a positive integer between 1 and 9."});
        }
        const channelNumber = channelName.split("-").length == 2 ? 0 : +channelName.split("-")[2];

        const aliveRoleName = channelNumber ? `Alive Town Member ${channelNumber}` : `Alive Town Member`;
        const deadRoleName = channelNumber ? `Dead Town Member ${channelNumber}` : `Dead Town Member`;

        if (interaction.guild.roles.cache.find(r => r.name == aliveRoleName || r.name == deadRoleName)){
            return interaction.followUp({content: `You currently have either/both "${aliveRoleName}" or "${deadRoleName}" defined as a server role. Delete the role(s) or change their name(s) to continue.`});
        }

        if (client.games.get(interaction.guildId)?.get(channelNumber).ongoing){
            return interaction.followUp({content: "A game has already started on this channel! You must wait for the game to end or expire, or create a game on a new channel"}); 
        } 

        if (client.gameUsers.get(interaction.user.id)){
            let [guildID, _ ] = client.gameUsers.get(interaction.user.id); //eslint-disable-line
            if (interaction.guildId == guildID) return interaction.followUp({content: "You've already joined another game on this server!"});
            else interaction.followUp({content: "You've already joined a game on some other server!"});
        }
    
        if(!client.games.get(interaction.guildId)) setupGuild(client, interaction.guildId);
        client.games.get(interaction.guildId).get(channelNumber).ongoing = true;

        if (params[0] === false) return interaction.followUp("A game has successfully been started.");
        addPlayerToGame(client, interaction.guildId, channelNumber, interaction.member.id);

        return interaction.followUp("A game has successfully been started.");
    }
};


