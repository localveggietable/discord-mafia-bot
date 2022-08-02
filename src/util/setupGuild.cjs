const {Collection} = require("discord.js");
/*
    @param {Client} client
    @param {Snowflake} guildID

    Adds a guild to client.games
*/

module.exports.setupGuild = function setupGuild(client, guildID){
    let gamesDataCollection = new Collection();
    let defaultChannelObj = {
        ongoing: false,
        started: false,
        players: 0,
        inGameRoles: [],
        day: 0

    };


    for (let i = 0; i < 10; ++i){
        gamesDataCollection.set(i, {...defaultChannelObj});
    }

    client.games.set(guildID, gamesDataCollection);
}