module.exports = function(client){
    client.on("defensePhase", async (playerID, lynchesLeft, timeLeft, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
            }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        
        //    const gameCache = client.games.get(guildID).get(channelID);

        let aliveRole = client.guilds.cache.get(guildID).roles.cache.find(role => role.name == "Alive Town Member");
        await Promise.all([outputChannel.permissionOverwrites.edit(aliveRole, {
            SEND_MESSAGES: false
        }), outputChannel.permissionOverwrites.edit(playerID, {
            SEND_MESSAGES: true
        })]);
        
        await outputChannel.send(`${client.users.cache.get(playerID).tag} , you are being suspected of being a traitor to the town. What is your defense?`);

        let defenseTime = 20;
        const interval = setInterval(async () => {
            if (!(--defenseTime)){
                await Promise.all([outputChannel.send(`It's judgement time! Decide whether or not ${client.users.cache.get(playerID).tag} is guilty.`), outputChannel.permissionOverwrites.edit(aliveRole, {SEND_MESSAGES: true})]);
                client.emit("votingPhase", playerID, lynchesLeft, timeLeft, guildID, channelID);
                clearInterval(interval);
            }
        }, 1000);
    });
}