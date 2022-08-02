const { SlashCommandBuilder } = require("@discordjs/builders");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("whisper")
    .setDescription("Whispers a private message to a player while in-game")
    .addUserOption(option => 
        option.setName("target")
            .setDescription("The user who you want to whisper to")
            .setRequired(true))
    ,
    async execute(client, interaction, params){
        const userToWhisper = params[0];
        const guild = interaction.guild;
        const userChannel = findUser
    }
}

function findUser(client, interaction){
    const gameCaches = client.games.get(interaction.guildId);
    //Proceed to find the channel in which the user is playing.
}