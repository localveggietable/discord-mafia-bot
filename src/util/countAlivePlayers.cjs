module.exports.countAlivePlayers = function(client, guildID, channelID){
    const playerList = client.games.get(guildID).get(channelID).inGameRoles;

    var count = 0, townCount = 0, mafCount = 0;
    for (let player of playerList){
        if (player.alive){ 
            ++count;
            if (player.faction == "Town") ++townCount;
            else if (player.faction == "Mafia") ++mafCount;
        }
    }

    console.log(count);
    return {count, townCount, mafCount};
}