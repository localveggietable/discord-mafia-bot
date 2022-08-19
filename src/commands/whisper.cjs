const { SlashCommandBuilder } = require("@discordjs/builders");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("whisper")
    .setDescription("Whispers a private message to a player while in-game")
    .addStringOption(option => 
        option.setName("target")
            .setDescription("The tag of the user who you want to whisper to")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("content")
            .setDescription("The message you want to send to the target")
            .setRequired(true))
    ,
    async execute(client, interaction, params){
        const userTarget = client.users.cache.find(user => user.tag == params[0]);
        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");
        if (!client.gameUsers.get(userTarget.id)) return interaction.followUp("Your target is not in a game!");
        if (!(client.gameUsers.get(userTarget.id) == client.gameUsers.get(interaction.user.id))) return interaction.followUp("Your target is not in the same game as you!");
        if (interaction.inGuild()) return interaction.followUp("You should be DM'ing me this command, not sending it through a Discord server!");

        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);
        const gameCache = client.games.get(guildID)?.get(channelID);

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        const [sourcePlayer, targetPlayer] = [gameCache.inGameRoles.find(interaction.user.id), gameCache.inGameRoles.find(userTarget.id)];

        if (!sourcePlayer.alive ) return interaction.followUp("You can't whisper as a dead player!");
        if (sourcePlayer.revealed) return interaction.followUp("You can't whisper as a revealed Mayor!");
        if (!gameCache.isDaytime) return interaction.followUp("You can only use this command in the day!");
        if (!targetPlayer.alive) return interaction.followUp("You can't whisper to a dead player!");
        if (targetPlayer.revealed) return interaction.followUp("You can't whisper to a revealed Mayor!");

        return userTarget.send(`${interaction.user.tag} whispered to you: ${params[1]}`);
    }
}