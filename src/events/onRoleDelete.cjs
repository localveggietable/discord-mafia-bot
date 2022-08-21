module.exports = function(client){
    client.on("roleDelete", (role) => {
        if (new RegExp("^(Alive Town Member( [1-9])?|Dead Town Member( [1-9])?)$").test(role.name)){
            const gamesDataCollection = client.games.get(role.guild.id);

            if (!gamesDataCollection) return;
            for (const [channelID, gameData] of gamesDataCollection.entries()){
                if (!gameData.ongoing) continue;
                client.emit("endGameError", role.guild.id, channelID);
            }
        }
    });
}