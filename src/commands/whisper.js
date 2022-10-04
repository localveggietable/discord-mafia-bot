const { SlashCommandBuilder } = require("@discordjs/builders");
const { isEqual } = require("lodash");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("whisper")
    .setDescription("Whispers a private message to a player while in-game")
    .addStringOption(option => 
        option.setName("target")
            .setDescription("The display name or tag of the user who you want to whisper to")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("content")
            .setDescription("The message you want to send to the target")
            .setRequired(true))
    ,
    async execute(client, interaction, params){
        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");
        if (interaction.inGuild()) return interaction.followUp("You should be DM'ing me this command, not sending it through a Discord server!");

        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);
        const gameCache = client.games.get(guildID)?.get(channelID);

        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        let usingUsername = params[0][params[0].length - 5] == "#" ? false : true;
        
        let user;
        if (usingUsername) {
            let guildMemberArray = client.guilds.cache.get(guildID).members.cache.filter(member => member.displayName == params[0] && isEqual(client.gameUsers.get(member.id), [guildID, channelID]));
            if (!guildMemberArray.size) return interaction.followUp("That user does not exist!");
            if (guildMemberArray.size > 1) return interaction.followUp("There are multiple members in this server with the same username, so you must enter the user's tag instead.");
            user = guildMemberArray.first().user;
        } else {
            let potentialMember = client.users.cache.find(user => user.tag == params[0] && isEqual(client.gameUsers.get(user.id), [guildID, channelID]));
            if (!potentialMember) return interaction.followUp("That user does not exist!");
            user = potentialMember;
        }

        const [sourcePlayer, targetPlayer] = [gameCache.inGameRoles.find(player => player.id == interaction.user.id), gameCache.inGameRoles.find(player => player.id == user.id)];

        if (!gameCache.started) return interaction.followUp("You can't whisper before the game has started!");
        if (sourcePlayer == targetPlayer) return interaction.followUp("You can't whisper to yourself!");
        if (!sourcePlayer.alive) return interaction.followUp("You can't whisper as a dead player!");
        if (sourcePlayer.revealed) return interaction.followUp("You can't whisper as a revealed Mayor!");
        if (!gameCache.isDaytime) return interaction.followUp("You can only use this command in the day!");
        if (!targetPlayer.alive) return interaction.followUp("You can't whisper to a dead player!");
        if (targetPlayer.revealed) return interaction.followUp("You can't whisper to a revealed Mayor!");

        await Promise.all([user.send(`${gameCache.inGameRoles.find(player => player.id == interaction.user.id).displayName} whispered to you: ${params[1]}`), outputChannel.send(`__${sourcePlayer.displayName}__ whispered something to __${targetPlayer.displayName}__.`)]);
        await interaction.followUp(`You have successfully whispered to ${params[0]}.`);

        return user.send(`${gameCache.inGameRoles.find(player => player.id == interaction.user.id).displayName} whispered to you: ${params[1]}`);
    }
}