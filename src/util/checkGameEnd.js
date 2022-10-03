const { countAlivePlayers } = require("./countAlivePlayers.js");

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

    const { _ , townCount, mafCount} = countAlivePlayers(client, guildID, channelID); //eslint-disable-line
    let winningFactions = exeHasWon ? ["Executioner"] : [];

    if (!townCount || !mafCount){
        if (!townCount && !mafCount){
            return {gameEnded: true, winningFactions};
        } else if (!townCount){
            if (aliveWitch){
                winningFactions.push("Mafia", "Witch");
            } else {
                winningFactions.push("Mafia");
            }
            return {gameEnded: true, winningFactions};  
        } else {
            winningFactions.push("Town");
            return {gameEnded: true, winningFactions};
        }
    } else {
        if (townCount == 1 && mafCount == 1){
            let townMember = gameCache.inGameRoles.find(player => player.alive && player.faction == "Town");
            let mafiaMember = gameCache.inGameRoles.find(player => player.alive && player.faction == "Mafia");
            if (!["Transporter", "Escort", "Jailor"].includes(townMember.role) || !["Godfather", "Mafioso"].includes(mafiaMember[0].role)){
                return {gameEnded: false, winningFactions: null}
            } else if (mafiaMember.role == "Mafioso" && townMember.role == "Transporter"){
                winningFactions.push("Town");
                return {gameEnded: true, winningFactions};
            } else {
                winningFactions.push("Mafia");
                return {gameEnded: true, winningFactions};
            }
        } else if(gameCache.day >= 7 && gameCache.daysWithoutDeath >= 2){
            return {gameEnded: true, winningFactions: winningFactions};
        } else {
            return {gameEnded: false, winningFactions: null};
        }
    }
}