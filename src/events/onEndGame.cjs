module.exports = function(client){
    client.on("endGame", async (winningFactions, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        let gameCache = client.games.get(guildID).get(channelID);
        let winningUsers = [];
        let defaultChannelObj = {
            ongoing: false,
            started: false,
            players: 0,
            inGameRoles: [],
            day: 0
    
        };

        for (let player of gameCache.inGameRoles){
            if (winningFactions.indexOf(player.role) != -1) winningUsers.push(client.users.cache.get(player.id).tag);
        }

        await Promise.all(client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == "Alive Town Member")),
        client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == "Dead Town Member")));

        await outputChannel.send(`The game ended! Players ${winningUsers.join(" ")} won!`);

        client.games.get(guildID).set(channelID, defaultChannelObj);
    });
}