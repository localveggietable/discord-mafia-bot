const {Collection} = require("discord.js");
/*
    @param {Client} client
    @param {Snowflake} guildID

    Adds a guild to client.games
*/

async function setupGuild(client, guildID){
    var gamesDataCollection = new Collection();
    var defaultChannelObj = {
        ongoing: false,
        started: false,
        players: 0,
    };


    for (let i = 0; i < 10; ++i){
        gamesDataCollection.set(i, {...defaultChannelObj});
    }

    client.games.set(guildID, gamesDataCollection);
}



module.exports = setupGuild;