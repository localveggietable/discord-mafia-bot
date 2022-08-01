const MafiaGamePlayer = require("../gameclasses/MafiaGamePlayer.cjs");
const TownGamePlayer = require("../gameclasses/TownGamePlayer.cjs");

module.exports.countAlivePlayers = function(client, guildID, channelID){
    const playerList = client.games.get(guildID).get(channelID).inGameRoles;

    var count, townCount, mafCount;
    for (let player of playerList){
        if (player.alive){ 
            ++count;
            if (TownGamePlayer.prototype.isPrototypeOf(player)) {++townCount}
            else if (MafiaGamePlayer.prototype.isPrototypeOf(player)) {++mafCount}
        }
    }

    return {count, townCount, mafCount};
}