require("dotenv").config();
const {Client, Collection} = require("discord.js");
//hello world


const bot = new Client({ intents: 32767 });
bot.commands = new Collection();


/*
bot.games:  <int, <int, object>>, where object looks like
{
    ongoing: boolean,
    started: boolean,
    players: array[Players]
    ingameroles: array[gameplayer]
    day: int

}

*/
bot.games = new Collection(); 

/*bot.on("interactionCreate", async function(interaction){
    if (!interaction.isChatInputCommand()) return;
    const commandName = interaction.commandName;

    await interaction.reply(commandName);
});


*/

bot.login(process.env.DISCORD_TOKEN);

(require("./src/handler.cjs"))(bot);
