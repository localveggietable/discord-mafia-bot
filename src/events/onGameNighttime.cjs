module.exports = function(client){
    client.on("gameNighttime", async (guildID, channelID ) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);
        let time = 45;


        const interval = setInterval(() => {
            if (!(--time)){
                client.emit("gameDaytime", false, guildID, channelID)
                clearInterval(interval);
            }
        }, 1000);
    });
}