module.exports = function(client){
    client.on("endGameError", async (guildID, channelID, intentional = false) => {
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

        const aliveRoleName = channelID ? `Alive Town Member ${channelID}`: "Alive Town Member";
        const deadRoleName = channelID ? `Dead Town Member ${channelID}`: "Dead Town Member";

        let gameCache = client.games.get(guildID).get(channelID);
        let defaultChannelObj = {
            ongoing: false,
            started: false,
            players: 0,
            inGameRoles: [],
            day: 0
    
        };

        for (let player of gameCache.inGameRoles){
            await outputChannel.permissionOverwrites.delete(player.id);
            client.gameUsers.delete(player.id);
        }

        await Promise.all(client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == aliveRoleName)),
        client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == deadRoleName)));

        await Promise.all([client.guilds.cache.get(guildID).channels.delete(mafiaChannel), client.guilds.cache.get(guildID).channels.delete(jailorChannel), client.guilds.cache.get(guildID).channels.delete(deadChannel)]);

        if (!intentional) await outputChannel.send("Someone messed with the roles needed to run this game :/ . This game will be aborted.");

        await outputChannel.permissionOverwrites.delete(guildID);

        client.games.get(guildID).set(channelID, defaultChannelObj);
    });
}