const { checkGameEnd } = require("../util/checkGameEnd.cjs");

module.exports = function(client){
    client.on("gameDaytime", async (firstDay, guildID, channelID, newDeaths) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});

        const mafiaChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID && channel.name.split("-")[0] == "mafia";
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "mafia-tos-channel"});

        let gameCache = client.games.get(guildID).get(channelID);

        const aliveRoleName = channelID ? `Alive Town Member ${channelID}`: "Alive Town Member";

        gameCache.day = firstDay ? 1 : ++gameCache.day;
        gameCache.isDaytime = true;
        let time = firstDay ? 15 : 60;

        await outputChannel.send(`This is the beginning of day ${gameCache.day}`);

        if (!firstDay) {
            await outputChannel.send(`Day ${gameCache.day}`);
            for (const player of newDeaths){
                await player.outputDeath(client, guildID, channelID);
            }

            let gameEnd = checkGameEnd(client, guildID, channelID);
            if (gameEnd.gameEnded) return client.emit("endGame", gameEnd.winningFactions, guildID, channelID);

            let blackmailedPlayers = gameCache.inGameRoles.filter(player => player.alive && player.blackmailed);

            await blackmailedPlayers.map(player => outputChannel.permissionOverwrites.edit(player.id, {
                SEND_MESSAGES: false
            }));

            await outputChannel.permissionOverwrites.edit(client.guilds.cache.get(guildID).roles.cache.find(role => role.name == aliveRoleName).id, {
                SEND_MESSAGES: true
            }); 

            //Handle all the permissions. change this into alive role rather than a person by person basis.
            try {
                await outputChannel.permissionOverwrites.edit(client.guilds.cache.get(guildID).roles.cache.find(role => role.name == aliveRoleName).id, {
                    SEND_MESSAGES: true
                });
            } catch (e) {
                await outputChannel.send("Someone messed with the channel roles needed to run this game :/ . This game will be aborted.");
                return client.emit("onEndGameError", guildID, channelID);
            }      
        } else {
            let message = '';
            gameCache.inGameRoles.filter(player => player.faction == "Mafia").forEach((player) => {
                message += `${player.tag} is a ${player.role} \n`;
            });
            await mafiaChannel.send(message.trim());
        }

        let interval = setInterval(async () => {
            --time;
            handleSetInterval(time, outputChannel, client, guildID, channelID, firstDay);
            if (!time){ 
                clearInterval(interval);
            }
        }, 1000);
    });
}

async function handleSetInterval(time, outputChannel, client, guildID, channelID, firstDay){
    if (!time){
        await outputChannel.send("The discussion phase ends now!");
        if (firstDay) return client.emit("gameNighttime", guildID, channelID);
        return client.emit("lynchPhase", 45, 3, guildID, channelID);
    } else if (!(time % 15)){
        await outputChannel.send(`The discussion phase ends in ${time} seconds`);
    }
}