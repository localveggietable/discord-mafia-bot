const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("forge")
        .setDescription("Forge a player's will")
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName("forged_will")
                .setDescription("A string that will replace the forged player's will (default: \"\"))")
                .setRequired(true)
        )
    
    ,
    execute(client, interaction, params){
        //Refactor this to be inside the mafia channel only.
        const channelName = interaction.channel.name;

        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");

        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);

        if (interaction.guildId != guildID) return interaction.followUp("You're not permitted to use this command in this server! (Try the server you're currently playing the game in.)");

        const matchChannelName = channelID ? `mafia-tos-channel-${channelID}` : "mafia-tos-channel";

        if (channelName != matchChannelName) return interaction.followUp("You're sending this command in the wrong channel!");

        const gameCache = client.games.get(guildID)?.get(channelID);

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        let player = gameCache.inGameRoles.find(player => player.id == interaction.user.id);
        if (!player.alive || player.role != "Forger") return interaction.followUp("You're not permitted to use this command!");
        if (gameCache.isDaytime) return interaction.followUp("You can only use this command at night!");
        
        player.targets.options = params[0];
        return interaction.followUp("Your target's will has been forged.");
    }
}