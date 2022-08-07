const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("jail")
        .setDescription("Jail a player")
        .addUserOption(option => 
            option.setName("user_to_jail")
                .setDescription("The user to be jailed")
                .setRequired(true)
        )
    
    ,
    async execute(client, interaction, params){
        var x = 1;
        if (x == 1) return interaction.followUp(`You entered user ${params}`);
        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");
        if (interaction.inGuild()) return interaction.followUp("You should be DM'ing me this command, not sending it through a Discord server!");

        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);
        const gameCache = client.games.get(guildID)?.get(channelID);

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        let player = gameCache.inGameRoles.find(player => player.id == interaction.user.id);
        if (!player.alive || player.role != "Jailor") return interaction.followUp("You're not permitted to use this command!");




    }
}