const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("writewill")
        .setDescription("Write your will")
        .addStringOption(option => 
            option.setName("will_content")
                .setDescription("A string that will be appended to or replace your will.")
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName("append?")
            .setDescription("Sets whether will_content is appended or replaced to your existing will (default true)")
            .setRequired(false))
    ,
    execute(client, interaction, params){
        //Refactor this to be inside the mafia channel only.
        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");
        if (interaction.inGuild()) return interaction.followUp("You should be DM'ing me this command, not sending it through a Discord server!");

        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);
        const gameCache = client.games.get(guildID)?.get(channelID);

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        let player = gameCache.inGameRoles.find(player => player.id == interaction.user.id);
        if (!player?.alive) return interaction.followUp("You're not permitted to use this command!");

        if (params[1] === false){
            player.will = params[0];
        } else {
            player.will += params[0];
        }
        return interaction.followUp("Your choice has been recorded. If your target dies by lynching, you will have to repick another target.");
    }
}