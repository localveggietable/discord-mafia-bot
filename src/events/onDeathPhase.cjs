const { checkGameEnd } = require("../util/checkGameEnd.cjs");
const { promisify } = require("util");

const delay = promisify(setTimeout);

module.exports = function(client){
    client.on("deathPhase", async (playerID, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
            }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);
        const player = gameCache.inGameRoles.find(player => player.id == playerID);

        await outputChannel.send(`The town has decided to lynch you, ${player.tag}. Do you have any last words?`);

        await delay(7000);

        let deathMessage = outputChannel.send("May God have mercy upon your soul.");
        let handleDeath = player.handleDeath(client, guildID);
        await deathMessage;
        await handleDeath;
        
        let gameEnd = checkGameEnd(client, guildID, channelID);
        if (gameEnd.gameEnded) return client.emit("endGame", gameEnd.winningFactions, guildID, channelID);

        await delay(1000);
        await outputChannel.send(`It is too late to continue voting.`);
        client.emit("gameNighttime", false, guildID, channelID);
        
    });
}