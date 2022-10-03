const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reveal")
        .setDescription("Reveal your identity as Mayor"),
    async execute(client, interaction){
        if (!client.gameUsers.get(interaction.user.id)) return interaction.followUp("You can't use this command outside of a game!");
        if (interaction.inGuild()) return interaction.followUp("You should be DM'ing me this command, not sending it through a Discord server!");


        let [guildID, channelID] = client.gameUsers.get(interaction.user.id);
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID)?.get(channelID);

        if (!gameCache) throw new Error("User's internals were not cleared from the custom gameUsers cache.");

        let player = gameCache.inGameRoles.find(player => player.id == interaction.user.id);
        if (!player.alive || player.role != "Mayor") return interaction.followUp("You're not permitted to use this command!");
        if (player.revealed) return interaction.followUp("You have already revealed yourself!");
        if (!gameCache.isDaytime) return interaction.followUp("You can't use this command at night!");

        player.revealed = true;
        await interaction.followUp("Your choice has been recorded. If your target dies by lynching, you will have to repick another target.");
        return outputChannel.send(`${player.tag} has revealed themselves as Mayor!`);
    }
}