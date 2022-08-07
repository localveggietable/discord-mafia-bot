/*
    @param {Client} client
    @param {Snowflake} guildID
    @param Number channelID
    @param {Snowflake} playerID

    Adds a player to client.games.get(guildID).players.
*/

async function addPlayerToGame(client, guildID, channelID, playerID){
    try{
        if (!client.games.get(guildID)) throw new Error("Something went wrong (guild wasn't initialized)");
        client.games.get(guildID).get(channelID).players.push(playerID);
        client.gameUsers.set(playerID, [guildID, channelID]);
        return;
    } catch (e){
        console.error(e.message);
        return;
    }
}


module.exports.addPlayerToGame = addPlayerToGame;