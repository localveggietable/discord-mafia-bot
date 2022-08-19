module.exports = function(client){
    client.on("endGame", async (winningFactions, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});

        const mafiaChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "mafia-tos-channel"});

        const jailorChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID && channel.name.split("-")[0] == "jailor";
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "jailor-tos-channel"}); 

        const deadChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID && channel.name.split("-")[0] == "dead";
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "dead-tos-channel"}); 

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
            client.gameUsers.delete(player.id);
        }

        await Promise.all(client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == "Alive Town Member")),
        client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == "Dead Town Member")));

        await Promise.all([client.guilds.cache.get(guildID).channels.delete(mafiaChannel), client.guilds.cache.get(guildID).channels.delete(jailorChannel), client.guilds.cache.get(guildID).channels.delete(deadChannel)]);

        await outputChannel.send(`The game ended! Players ${winningUsers.join(" ")} won!`);

        client.games.get(guildID).set(channelID, defaultChannelObj);
    });
}