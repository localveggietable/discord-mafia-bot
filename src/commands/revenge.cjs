const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("revenge")
        .setDescription("Take revenge on a player who lynched you.")
        .addStringOption(option => 
            option.setName("player_to_revenge")
                .setDescription("The tag of the player to take revenge on")
                .setRequired(true)
        )
    
    ,
    execute(client, interaction, params){
        const userTarget = client.users.cache.find(user => user.tag == params[0]);
        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");
        if (interaction.inGuild()) return interaction.followUp("You should be DM'ing me this command, not sending it through a Discord server!");

        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);
        const gameCache = client.games.get(guildID)?.get(channelID);

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        let player = gameCache.inGameRoles.find(player => player.id == interaction.user.id);
        if (!player.jester || !player.canRevenge) return interaction.followUp("You're not permitted to use this command!");
        if (gameCache.isDaytime) return interaction.followUp("You can only use this command at night!");
        
        let target = gameCache.inGameRoles.find(target => target.id == userTarget.id);
        if (!target) return interaction.followUp("That player doesn't exist!");
        if (!target.alive) return interaction.followUp("You can't take revenge on a dead player!");

        player.targets.first = target.id;

        return interaction.followUp("Your choice has been recorded.");
    }
}
