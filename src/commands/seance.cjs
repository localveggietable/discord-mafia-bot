const { SlashCommandBuilder } = require("@discordjs/builders");
const { isEqual } = require("lodash");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("seance")
        .setDescription("Choose a player to talk to ")
        .addStringOption(option => 
            option.setName("player_to_seance")
                .setDescription("The display name or tag of the player you want to seance")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("message_to_seance")
                .setDescription("The message you want to send the player")
                .setRequired(true))
    ,
    async execute(client, interaction, params){
        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");
        if (interaction.inGuild()) return interaction.followUp("You should be DM'ing me this command, not sending it through a Discord server!");

        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);
        const gameCache = client.games.get(guildID)?.get(channelID);

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        let usingUsername = params[0][params[0].length - 5] == "#" ? false : true;
        
        let user;
        if (usingUsername) {
            let guildMemberArray = client.guilds.cache.get(guildID).members.cache.filter(member => member.displayName == params[0] && isEqual(client.gameUsers.get(member.id), [guildID, channelID]));
            if (!guildMemberArray.size) return interaction.followUp("That user does not exist!");
            if (guildMemberArray.size > 1) return interaction.followUp("There are multiple members in this server with the same username, so you must enter the user's tag instead.");
            user = guildMemberArray.first().user;
        } else {
            let potentialUser = client.users.cache.find(user => user.tag == params[0] && isEqual(client.gameUsers.get(user.id), [guildID, channelID]));
            if (!potentialUser) return interaction.followUp("That user does not exist!");
            user = potentialUser;
        }

        let player = gameCache.inGameRoles.find(player => player.id == interaction.user.id);
        if (player.alive || player.role != "Medium") return interaction.followUp("You're not permitted to use this command!");
        if (!player.canSeance) return interaction.followUp("You've already seanced once!");
        
        let target = gameCache.inGameRoles.find(target => target.id == user.id);
        if (!target) return interaction.followUp("That player doesn't exist!");
        if (!target.alive) return interaction.followUp("You can't seance a dead player!");

        await user.send(`${gameCache.find(player => player.id == interaction.user.id).displayName}'s seance tells you: ${params[1]}`);
        player.canSeance = false;
        return interaction.followUp("Your choice has been recorded. If your target dies by lynching, you will have to repick another target.");
    }
}