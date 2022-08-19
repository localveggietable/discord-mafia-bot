module.exports.countAlivePlayers = function(client, guildID, channelID){
    const playerList = client.games.get(guildID).get(channelID).inGameRoles;

    var count, townCount, mafCount;
    for (let player of playerList){
        if (player.alive){ 
            ++count;
            if (player.faction == "Town") {++townCount}
            else if (player.faction == "Mafia") {++mafCount}
        }
    }

    return {count, townCount, mafCount};
}