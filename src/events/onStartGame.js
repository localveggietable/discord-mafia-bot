const {shuffleArray} = require( "../util/shuffleArray.js");
const {Permissions} = require("discord.js");
const WitchGamePlayer = require("../gameclasses/WitchGamePlayer.js");
const ExeGamePlayer = require("../gameclasses/ExeGamePlayer.js");
const MafiaGamePlayer = require("../gameclasses/MafiaGamePlayer.js");
const TownGamePlayer = require("../gameclasses/TownGamePlayer.js");

module.exports = function(client){
    client.on("startGame", async function(guildID, channelID){

        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});

        const gameCache = client.games.get(guildID).get(channelID);

        //Create roles.

        const aliveRoleName = channelID ? `Alive Town Member ${channelID}`: "Alive Town Member";
        const deadRoleName = channelID ? `Dead Town Member ${channelID}`: "Dead Town Member";
        
        await Promise.all([
        client.guilds.cache.get(guildID).roles.create({
            name: aliveRoleName,
            color: "ORANGE"
        }), 
        client.guilds.cache.get(guildID).roles.create({
            name: deadRoleName,
            color: "BLUE"
        })]);

        const aliveRole = client.guilds.cache.get(guildID).roles.cache.find(r => r.name == aliveRoleName);
        await gameCache.players.map((playerID) => client.guilds.cache.get(guildID).members.cache.get(playerID)).forEach(member => member.roles.add(aliveRole).catch(console.error));

        //

        let time = 15;
        

        //Algo for assigning roles:
        //
        // Decide what the roles will be this game.
        // Label everyone with a random number from 1 to n O(n)
        // Decide everyone's roles who are not random town.
        //

        let tiRoles = ["Investigator", "Lookout", "Spy", "Sheriff"], tpRoles = ["Doctor", "Bodyguard"], tkRoles = ["Veteran", "Vigilante"], tsRoles = ["Escort", "Mayor", "Retributionist", "Medium", "Transporter"], mafRoles = ["Ambusher", "Blackmailer", "Consigliere", "Consort", "Disguiser", "Forger", "Framer", "Hypnotist", "Janitor"];

        let [tiRole1, tiRole2, tpRole, tkRole, tsRole, rmRole1] = [tiRoles[Math.floor(Math.random() * 4)], tiRoles[Math.floor(Math.random() * 4)], 
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
        if (["Veteran", "Mayor", "Retributionist"].includes(rtRole1)) {
            rtRoles.splice(rtRoles.indexOf(rtRole1), 1);
        }

        rtRole2 = rtRoles[Math.floor(Math.random() * (rtRoles.length - 1))];
        if (["Veteran", "Mayor", "Retributionist"].includes(rtRole2)) {
            rtRoles.splice(rtRoles.indexOf(rtRole2), 1);
        }

        rtRole3 = rtRoles[Math.floor(Math.random() * (rtRoles.length - 1))];

        let shufflePlayers = shuffleArray([...gameCache.players]);
        let mafiaPlayerIDs = shufflePlayers.slice(9, 13);

        const membersCache = client.guilds.cache.get(guildID).members.cache;
        
        gameCache.inGameRoles = shuffleArray([new TownGamePlayer("Jailor", shufflePlayers[0], client.users.cache.get(shufflePlayers[0]).tag, membersCache.get(shufflePlayers[0]).displayName), 
        new TownGamePlayer(tiRole1, shufflePlayers[1], client.users.cache.get(shufflePlayers[1]).tag, membersCache.get(shufflePlayers[1]).displayName), 
        new TownGamePlayer(tiRole2, shufflePlayers[2], client.users.cache.get(shufflePlayers[2]).tag, membersCache.get(shufflePlayers[2]).displayName), 
        new TownGamePlayer(tpRole, shufflePlayers[3], client.users.cache.get(shufflePlayers[3]).tag, membersCache.get(shufflePlayers[3]).displayName),
        new TownGamePlayer(tkRole, shufflePlayers[4], client.users.cache.get(shufflePlayers[4]).tag, membersCache.get(shufflePlayers[4]).displayName), 
        new TownGamePlayer(tsRole, shufflePlayers[5], client.users.cache.get(shufflePlayers[5]).tag, membersCache.get(shufflePlayers[5]).displayName), 
        new TownGamePlayer(rtRole1, shufflePlayers[6], client.users.cache.get(shufflePlayers[6]).tag, membersCache.get(shufflePlayers[6]).displayName), 
        new TownGamePlayer(rtRole2, shufflePlayers[7], client.users.cache.get(shufflePlayers[7]).tag, membersCache.get(shufflePlayers[7]).displayName), 
        new TownGamePlayer(rtRole3, shufflePlayers[8], client.users.cache.get(shufflePlayers[8]).tag, membersCache.get(shufflePlayers[8]).displayName), 
        new MafiaGamePlayer("Godfather", shufflePlayers[9], client.users.cache.get(shufflePlayers[9]).tag, membersCache.get(shufflePlayers[9]).displayName), 
        new MafiaGamePlayer("Mafioso", shufflePlayers[10], client.users.cache.get(shufflePlayers[10]).tag, membersCache.get(shufflePlayers[10]).displayName), 
        new MafiaGamePlayer(rmRole1, shufflePlayers[11], client.users.cache.get(shufflePlayers[11]).tag, membersCache.get(shufflePlayers[11]).displayName),
        new MafiaGamePlayer(rmRole2, shufflePlayers[12], client.users.cache.get(shufflePlayers[12]).tag, membersCache.get(shufflePlayers[12]).displayName), 
        new ExeGamePlayer(shufflePlayers[13], client.users.cache.get(shufflePlayers[13]).tag, membersCache.get(shufflePlayers[13]).displayName, shufflePlayers[Math.floor(Math.random() * 9)]), 
        new WitchGamePlayer(shufflePlayers[14], client.users.cache.get(shufflePlayers[14]).tag, membersCache.get(shufflePlayers[14]).displayName)]);

        console.log(gameCache.inGameRoles.length);
        let displayNameMap = new Map();
        for (const player of gameCache.inGameRoles){
            console.log(`${player.tag}: ${player.role} \n`);
            if (displayNameMap.get(player.displayName)) {
                let original = gameCache.inGameRoles.find(original => original.id == displayNameMap.get(player.displayName)); 
                player.displayName = player.tag;
                original.displayName = original.tag;
            }
            else displayNameMap.set(player.displayName, player.id);
        }

        //Set default permissions.


        await outputChannel.permissionOverwrites.set([
            {
                id: guildID,
                deny: [Permissions.FLAGS.SEND_MESSAGES]
            },
            {
                id: client.guilds.cache.get(guildID).roles.cache.find(role => role.name == aliveRoleName).id,
                allow: [Permissions.FLAGS.SEND_MESSAGES]
            }
        ]);


        //Send players their roles

        let messages = [];
        for (const player of gameCache.inGameRoles) {
            let msgToSend = player.faction == "Executioner" ? `Welcome to tos! Your role is ${player.role} \nYour target this game is ${gameCache.inGameRoles.find(target => target.id == player.targetID).displayName}.` : `Welcome to tos! Your role is ${player.role}.`;
            if (player.faction == "Mafia") msgToSend = msgToSend + "\nYou are a mafia member this game! This means that you have access to a mafia-only chat wherein you will be able to communicate with your fellow mafia members at night. You will also choose your nightly targets in that channel.";
            messages.push(client.users.cache.get(player.id).send(msgToSend));
        }

        await Promise.all(messages);

        let interval = setInterval(() => {
            handleSetInterval(outputChannel, gameCache, client, guildID, channelID, time--, mafiaPlayerIDs, deadRoleName);
            if (time < 0){
                clearInterval(interval);
            }
        }, 1000);
    });
}

//this ensures that gameDaytime is emitted only after the channel has been notified.
async function handleSetInterval(outputChannel, gameCache, client, guildID, channelID, time, mafiaPlayerIDs, deadRoleName){
    if (!time){
        gameCache.started = true;

        await Promise.all([client.guilds.cache.get(guildID).channels.create(`mafia-${outputChannel.name}`, {
            type: "GUILD_TEXT",
            permissionOverwrites: [
                //For everyone in the server
                {
                    id: guildID,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
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
                    id: client.guilds.cache.get(guildID).roles.cache.find(r => r.name == deadRoleName).id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                }
            ]
        })]);

        return client.emit("gameDaytime", true, guildID, channelID); 
    }
    if (!(time % 5)) await outputChannel.send({content: `The game starts in ${time} seconds.`});
}