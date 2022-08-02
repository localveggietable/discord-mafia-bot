const ExeGamePlayer = require("../gameclasses/ExeGamePlayer.cjs");
const MafiaGamePlayer = require("../gameclasses/MafiaGamePlayer.cjs");
const TownGamePlayer = require("../gameclasses/TownGamePlayer.cjs");
const WitchGamePlayer = require("../gameclasses/WitchGamePlayer.cjs");

//Returns an object with a boolean indicating whether or not the game has ended, and an array of strings to indicate which factions have won.

/*

@param {Client} client
@param {Snowflake} guildID
@param Number channelID
*/

module.exports.checkGameEnd = function(client, guildID, channelID){
    const gameCache = client.games.get(guildID).get(channelID);
    const aliveTownMembers = gameCache.inGameRoles.filter(player => TownGamePlayer.prototype.isPrototypeOf(player) && player.alive);
    const aliveMafiaMembers = gameCache.inGameRoles.filter(player => MafiaGamePlayer.prototype.isPrototypeOf(player) && player.alive);
    const aliveWitchMembers = gameCache.ingameRoles.filter(player => WitchGamePlayer.prototype.isPrototypeOf(player) && player.alive);
    const exeHasWon = gameCache.inGameRoles.filter(player => ExeGamePlayer.prototype.isPrototypeOf(player) && player.won);

    let winningFactions = exeHasWon ? ["Executioner"] : [];


    if (!aliveTownMembers.length || !aliveMafiaMembers.length){
        if (!aliveTownMembers.length && !aliveMafiaMembers.length){
            return {gameEnded: true, winningFactions: []};
        } else if (!aliveTownMembers.length){
            return aliveWitchMembers.length ? {gameEnded: true, winningFactions: winningFactions.push("Mafia", "Witch")} : {gameEnded: true, winningFactions: winningFactions.push("Mafia")};  
        } else {
            return {gameEnded: true, winningFactions: winningFactions.push("Town")};
        }
    } else {
        if (aliveTownMembers.length == 1 && aliveMafiaMembers == 1){
            if (["Transporter", "Escort", "Jailor"].indexOf(aliveTownMembers[0].role) == -1 || ["Godfather", "Mafioso"].indexOf(aliveMafiaMembers[0].role) == -1){
                return {gameEnded: false, winningFactions: null}
            } else if (aliveMafiaMembers[0].role == "Mafioso" && aliveTownMembers[0].role == "Transporter"){
                return {gameEnded: true, winningFactions: winningFactions.push("Town")};
            } else {
                return {gameEnded: true, winningFactions: winningFactions.push("Mafia")};
            }
        } else {
            return {gameEnded: false, winningFactions: null};
        }
    }
}