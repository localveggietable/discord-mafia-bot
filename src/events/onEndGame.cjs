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
            players: [],
            inGameRoles: [],
            isDaytime: true,
            day: 0,
            daysWithoutDeath: 0
        };

        const aliveRoleName = channelID ? `Alive Town Member ${channelID}`: "Alive Town Member";
        const deadRoleName = channelID ? `Dead Town Member ${channelID}`: "Dead Town Member";
        for (let player of gameCache.inGameRoles){
            await outputChannel.permissionOverwrites.delete(player.id);
            if (winningFactions.includes(player.faction)) winningUsers.push(player.tag);
            client.gameUsers.delete(player.id);
        }

        await Promise.all([client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == aliveRoleName)),
        client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == deadRoleName))]);

        await Promise.all([client.guilds.cache.get(guildID).channels.delete(mafiaChannel), client.guilds.cache.get(guildID).channels.delete(jailorChannel), client.guilds.cache.get(guildID).channels.delete(deadChannel)]);

        await outputChannel.send(`The game ended! Players ${winningUsers.join(" ")} won!`);

        await outputChannel.permissionOverwrites.delete(guildID);
        
        client.games.get(guildID).set(channelID, defaultChannelObj);
    });
}