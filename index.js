const {Client, Collection} = require("discord.js");

const bot = new Client({ intents: 32767 });
bot.commands = new Collection();
bot.gameUsers = new Collection();


/*
bot.games:  <int, <int, object>>, where object looks like
{
    ongoing: boolean, (refers to whether the /startgame command was executed)
    started: boolean, (refers to whether the actual game has started)
    players: array[user_ids]
    inGameRoles: array[gameplayer]
    isDaytime: boolean
    day: int
    daysWithoutDeath: int
}

*/
bot.games = new Collection(); 

bot.login(process.env.DISCORD_TOKEN);

(require("./src/handler.js"))(bot);

