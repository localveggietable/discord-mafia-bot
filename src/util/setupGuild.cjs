const {Collection} = require("discord.js");
const {cloneDeep} = require("lodash");
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
        players: [],
        inGameRoles: [],
        isDaytime: true,
        day: 0,
        daysWithoutDeath: 0
    };


    for (let i = 0; i < 10; ++i){
        gamesDataCollection.set(i, cloneDeep(defaultChannelObj));
    }

    client.games.set(guildID, gamesDataCollection);
}