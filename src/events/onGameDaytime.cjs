module.exports = async function(client){
    client.on("gameDaytime", async (firstDay, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        let gameCache = client.games.get(guildID).get(channelID);

        gameCache.day = firstDay ? 1 : gameCache.day + 1;
        let time = firstDay ? 16 : 61;
        gameCache.remainingTime = time;

        let interval = setInterval(() => {
            if (!(--time)){ 
                outputChannel.send(`The discussion phase ends now!`);
                gameCache.remainingTime = 0;
                client.emit("lynchPhase");
                clearInterval();
            }
            if (!(time % 15)) outputChannel.send(`The discussion phase ends in ${time} seconds.`);
            gameCache.remainingTime = time;

        }, 1000);
    });
}