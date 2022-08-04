module.exports = function(client){
    client.on("gameDaytime", async (firstDay, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        let gameCache = client.games.get(guildID).get(channelID);

        gameCache.day = firstDay ? 1 : gameCache.day + 1;
        let time = firstDay ? 15 : 50;
        gameCache.remainingTime = time;

        let interval = setInterval(async () => {
            --time;
            handleSetInterval(time, outputChannel, client, guildID, channelID);
            if (!(--time)){ 
                clearInterval(interval);
            }
        }, 1000);
    });
}

async function handleSetInterval(time, outputChannel, client, guildID, channelID){
    if (!time){
        await outputChannel.send("The discussion phase ends now!");
        client.emit("lynchPhase", 45, 3, guildID, channelID);
    } else if (!(time % 15)){
        await outputChannel.send(`The discussion phase ends in ${time} seconds`);
    }
}