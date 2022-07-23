require("dotenv").config();
const {Client, Collection} = require("discord.js");
const listeners = require("./util/setCommands.cjs");


const bot = new Client({ intents: 32767 });
bot.commands = new Collection();

bot.on("ready", function(client){
    console.log(`${client.user.tag} is connected!`);
    client.channels.cache.find(channel => channel.name == "geneal").send;
});

/*bot.on("interactionCreate", async function(interaction){
    if (!interaction.isChatInputCommand()) return;
    const commandName = interaction.commandName;

    await interaction.reply(commandName);
});


*/

bot.login(process.env.DISCORD_TOKEN);