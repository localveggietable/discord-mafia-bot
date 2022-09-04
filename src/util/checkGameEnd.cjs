const { countAlivePlayers } = require("./countAlivePlayers.cjs");

//Returns an object with a boolean indicating whether or not the game has ended, and an array of strings to indicate which factions have won.

/*

@param {Client} client
@param {Snowflake} guildID
@param Number channelID
*/

module.exports.checkGameEnd = function(client, guildID, channelID){
    const gameCache = client.games.get(guildID).get(channelID);
    const aliveWitch = gameCache.inGameRoles.find(player => player.faction == "Witch" && player.alive) ? 1 : 0;
    const exeHasWon = gameCache.inGameRoles.find(player => player.faction == "Executioner" && player.won) ? true : false;
    const jesterHasWon = gameCache.inGameRoles.find(player => player.faction == "Jester" && player.won) ? true : false; 

    const { _ , townCount, mafCount} = countAlivePlayers(client, guildID, channelID); //eslint-disable-line
    let winningFactions = exeHasWon ? ["Executioner"] : jesterHasWon ? ["Jester"] : [];

    if (!townCount || !mafCount){
        if (!townCount.length && !mafCount.length){
            return {gameEnded: true, winningFactions: []};
        } else if (!townCount){
            return aliveWitch ? {gameEnded: true, winningFactions: winningFactions.push("Mafia", "Witch")} : {gameEnded: true, winningFactions: winningFactions.push("Mafia")};  
        } else {
            return {gameEnded: true, winningFactions: winningFactions.push("Town")};
        }
    } else {
        if (townCount == 1 && mafCount == 1){
            let townMember = gameCache.inGameRoles.find(player => player.alive && player.faction == "Town");
            let mafiaMember = gameCache.inGameRoles.find(player => player.alive && player.faction == "Mafia");
            if (!["Transporter", "Escort", "Jailor"].includes(townMember.role) || !["Godfather", "Mafioso"].includes(mafiaMember[0].role)){
                return {gameEnded: false, winningFactions: null}
            } else if (mafiaMember.role == "Mafioso" && townMember.role == "Transporter"){
                return {gameEnded: true, winningFactions: winningFactions.push("Town")};
            } else {
                return {gameEnded: true, winningFactions: winningFactions.push("Mafia")};
            }
        } else {
            return {gameEnded: false, winningFactions: null};
        }
    }
}