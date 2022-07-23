require("dotenv").config();
const {REST} = require("@discordjs/rest");
const {Routes, ClientVoiceManager} = require("discord.js");
const glob = require("fast-glob");
const {promisify} = require("util");
const [guildID, clientID, botToken] = [process.env.GUILD_ID, process.env.CLIENT_ID, process.env.DISCORD_TOKEN];


const asyncGlob = promisify(glob);
const rest = new REST({ version: '10' }).setToken(botToken);

/*
Deploys all the commands to the guild. Imports and listens for the events defined in ./events.

    @param Client bot

*/

module.exports = async function(client){

    var commands = [];
    const [commandsFiles, eventFiles] = await Promise.all(asyncGlob(`${__dirname}/commands/**/*.cjs`), asyncGlob(`${__dirname}/events/**/*.cjs`));

    /* Sets up all the event listeners (interactionCreate, etc.) */
    for (const file in eventFiles){
        (require(file))(client);
    }

    /* Saves commands inside bot.commands, updates commands array to push commands into the guild cache */

    for (const file in commandsFiles){
        try{
            const getCommand = require(file);

            if (!getCommand.data.name) throw new Error("Slash command name is either falsy or not specified");

            client.commands.set(getCommand.data.name, getCommand);
            commands.push(getCommand.data.toJSON());

        } catch (e){
            console.error(e.message);
            return;
        }
    }

    /*
    Saves the commands in the development guild's cache, as recommended via the Discord.js documentation.
    */
    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');
    
            await rest.put(
            Routes.applicationGuildCommands(clientID, guildID),
                { body: commands },
            );
    
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();



}