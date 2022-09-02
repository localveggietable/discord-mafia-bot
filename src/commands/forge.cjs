const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("forge")
        .setDescription("Forge a player's will")
        .addStringOption(option => 
            option.setName("forged_will")
                .setDescription("A string that will replace the forged player's will (default: \"\"))")
                .setRequired(false)
        )
    
    ,
    execute(client, interaction, params){
        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");
        if (interaction.inGuild()) return interaction.followUp("You should be DM'ing me this command, not sending it through a Discord server!");

        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);
        const gameCache = client.games.get(guildID)?.get(channelID);

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        let player = gameCache.inGameRoles.find(player => player.id == interaction.user.id);
        let target = gameCache.inGameRoles.find(target => target.id == player.targets.first);
        if (!player.alive || player.role != "Forger") return interaction.followUp("You're not permitted to use this command!");
        if (gameCache.isDaytime) return interaction.followUp("You can only use this command at night!");
        
        if (!target) return interaction.followUp("That player doesn't exist!");
        if (!target.alive) return interaction.followUp("You can't forge a dead player!");

        let publicWill = params[0] ? params[0] : "";
        player.publicWill = publicWill;
        return interaction.followUp("Your target's will has been forged.");
    }
}