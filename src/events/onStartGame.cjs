const {shuffleArray} = require( "../util/shuffleArray.cjs");
const {WitchGamePlayer} = require("../gameclasses/WitchGamePlayer.cjs");
const {ExeGamePlayer} = require("../gameclasses/ExeGamePlayer.cjs");
const {MafiaGamePlayer} = require("../gameclasses/MafiaGamePlayer.cjs");
const {TownGamePlayer} = require("../gameclasses/TownGamePlayer.cjs");

module.exports = function(client){
    client.on("startGame", async function(guildID, channelID){

        const gameCache = client.games.get(guildID).get(channelID);
        //Create roles.

        //Needs to be changed, see TODO
        if (!(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == "Alive Town Member" || r.name == "Dead Town Member"))){
            client.guilds.cache.get(guildID).roles.delete(client.guilds.cache.get(guildID).roles.cache.find(r => r.name == "Alive Town Member" || r.name == "Dead Town Member"));
        }

        await Promise.all([
        client.guilds.cache.get(guildID).roles.create({
            name: "Alive Town Member",
            color: "ORANGE"
        }), 
        client.guilds.cache.get(guildID).roles.create({
            name: "Dead Town Member",
            color: "BLUE"
        })]);

        const aliveRole = client.guilds.cache.get(guildID).roles.cache.find(r => r.name == "Alive Town Member");
        await gameCache.players.map((playerID) => client.guilds.cache.get(guildID).members.cache.get(playerID)).forEach(member => member.roles.add(aliveRole).catch(console.error));

        //

        let time = 15;
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});

        //Algo for assigning roles:
        //
        // Decide what the roles will be this game.
        // Label everyone with a random number from 1 to n O(n)
        // Decide everyone's roles who are not random town.
        //

        let tiRoles = ["Investigator", "Lookout", "Spy"], tpRoles = ["Doctor", "Bodyguard"], tkRoles = ["Veteran, Vigilante"], tsRoles = ["Escort", "Mayor", "Retributionist", "Medium", "Transporter"], mafRoles = ["Ambusher", "Blackmailer", "Consigliere", "Consort", "Disguiser", "Forger", "Framer", "Hypnotist", "Janitor"];

        let [tiRole1, tiRole2, tpRole, tkRole, tsRole, rmRole1] = [tiRoles[Math.floor(Math.random() * 3)], tiRoles[Math.floor(Math.random() * 4)], 
            tpRoles[Math.floor(Math.random() * 2)], tkRoles[Math.floor(Math.random() * 2)],
            tsRoles[Math.floor(Math.random() * 5)], mafRoles[Math.floor(Math.random() * 9)]];
        
        let rmRole2 = rmRole1 == "Ambusher" ? mafRoles[Math.floor(Math.random() * 8 + 1)] : mafRoles[Math.floor(Math.random() * 9)]; 

        let rtRoles = tiRoles.concat(tpRoles, tkRoles, tsRoles);
        if (tkRole == "Veteran") rtRoles.splice(rtRoles.indexOf("Veteran"), 1);
        if (tsRole == "Mayor"){
            rtRoles.splice(rtRoles.indexOf("Mayor"), 1); 
        } else if (tsRole == "Retributionist"){
            rtRoles.splice(rtRoles.indexOf("Retributionist"), 1);  
        }
        let rtRole1, rtRole2, rtRole3;

        rtRole1 = rtRoles[Math.floor(Math.random() * (rtRoles.length - 1))];
        if (["Veteran", "Mayor", "Retributionist"].indexOf(rtRole1) > -1) {
            rtRoles.splice(rtRoles.indexOf(rtRole1), 1);
        }

        rtRole2 = rtRoles[Math.floor(Math.random() * (rtRoles.length - 1))];
        if (["Veteran", "Mayor", "Retributionist"].indexOf(rtRole2) > -1) {
            rtRoles.splice(rtRoles.indexOf(rtRole2), 1);
        }

        rtRole3 = rtRoles[Math.floor(Math.random() * (rtRoles.length - 1))];
        if (["Veteran", "Mayor", "Retributionist"].indexOf(rtRole3) > -1) {
            rtRoles.splice(rtRoles.indexOf(rtRole3), 1);
        }

        let shufflePlayers = shuffleArray([...gameCache.players]);
        let mafiaPlayerIDs = shufflePlayers.slice(9, 13);
        
        gameCache.inGameRoles = [new TownGamePlayer("Jailor", shufflePlayers[0], client.users.cache.get(shufflePlayers[0]).tag), new TownGamePlayer(tiRole1, shufflePlayers[1], client.users.cache.get(shufflePlayers[1]).tag), 
        new TownGamePlayer(tiRole2, shufflePlayers[2], client.users.cache.get(shufflePlayers[2]).tag), new TownGamePlayer(tpRole, shufflePlayers[3], client.users.cache.get(shufflePlayers[3]).tag),
        new TownGamePlayer(tkRole, shufflePlayers[4], client.users.cache.get(shufflePlayers[4]).tag), new TownGamePlayer(tsRole, shufflePlayers[5], client.users.cache.get(shufflePlayers[5]).tag), 
        new TownGamePlayer(rtRole1, shufflePlayers[6], client.users.cache.get(shufflePlayers[6]).tag), new TownGamePlayer(rtRole2, shufflePlayers[7], client.users.cache.get(shufflePlayers[7]).tag), 
        new TownGamePlayer(rtRole3, shufflePlayers[8], client.users.cache.get(shufflePlayers[8]).tag), new MafiaGamePlayer("Godfather", shufflePlayers[9], client.users.cache.get(shufflePlayers[9]).tag), 
        new MafiaGamePlayer("Mafioso", shufflePlayers[10], client.users.cache.get(shufflePlayers[10]).tag), new MafiaGamePlayer(rmRole1, shufflePlayers[11], client.users.cache.get(shufflePlayers[11]).tag),
        new MafiaGamePlayer(rmRole2, shufflePlayers[12], client.users.cache.get(shufflePlayers[12]).tag), new ExeGamePlayer(shufflePlayers[13], client.users.cache.get(shufflePlayers[13]).tag), 
        new WitchGamePlayer(shufflePlayers[14], client.users.cache.get(shufflePlayers[14]).tag)];

        //Create a mafia only channel.

        await Promise.all([client.guilds.cache.get(guildID).channels.create(`mafia-${outputChannel.name}`, {
            type: "GUILD_TEXT",
            permissionOverwrites: [
                //For everyone in the server
                {
                    id: guildID,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                },
                {
                    id: mafiaPlayerIDs[0],
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                },
                {
                    id: mafiaPlayerIDs[1],
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                },
                {
                    id: mafiaPlayerIDs[2],
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                },
                {
                    id: mafiaPlayerIDs[3],
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                },
            ]
        }), client.guilds.cache.get(guildID).channels.create(`jailor-${outputChannel.name}`, {
            type: "GUILD_TEXT",
            permissionOverwrites: [
                {
                    id: guildID,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                }
            ]
        }), client.guilds.cache.get(guildID).channels.create(`dead-${outputChannel.name}`, {
            type: "GUILD_TEXT",
            permissionOverwrites: [
                {
                    id: guildID,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                },
                {
                    id: client.guilds.cache.get(guildID).roles.cache.find(r => r.name == "Dead Town Member").id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                }
            ]
        })]);


        //Set default permissions.


        try {
                await outputChannel.permissionOverwrites.set([
                {
                    id: guildID,
                    deny: [Permissions.FLAGS.SEND_MESSAGES]
                },
                {
                    id: client.guilds.cache.get(guildID).roles.cache.find(role => role.name == "Alive Town Member").id,
                    allow: [Permissions.FLAGS.SEND_MESSAGES]
                }
            ]);
        } catch (e) {
            await outputChannel.send("Someone messed with the channel roles needed to run this game :/ . This game will be aborted.");
            return client.emit("onEndGameError", guildID, channelID);
        }

        //Send players their roles

        let messages = [];
        for (const player of gameCache.inGameRoles) {
            messages.push(client.users.cache.get(player.id).send(`Welcome to tos! Your role is ${player.role}`));
        }

        let interval = setInterval(() => {
            handleSetInterval(outputChannel, gameCache, guildID, channelID, time--);
            if (!time){
                clearInterval(interval);
            }
        }, 1000);
    });
}

//this ensures that gameDaytime is emitted only after the channel has been notified.
async function handleSetInterval(outputChannel, gameCache, client, guildID, channelID, time){
    await outputChannel.send(time);
    if (!time){
        gameCache.started = true;
        client.emit("gameDaytime", true, guildID, channelID);
    }
}