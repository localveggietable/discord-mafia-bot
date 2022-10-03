const {shuffleArray} = require( "../util/shuffleArray.js");
const {Permissions} = require("discord.js");
const WitchGamePlayer = require("../gameclasses/WitchGamePlayer.js");
const ExeGamePlayer = require("../gameclasses/ExeGamePlayer.js");
const MafiaGamePlayer = require("../gameclasses/MafiaGamePlayer.js");
const TownGamePlayer = require("../gameclasses/TownGamePlayer.js");

const roleDescriptions = {
    Investigator: {
        summary: "You are a private eye who secretly gathers information.",
        abilities: "Investigate one person each night for a clue to their role.",
        attributes: "None.",
        goal: "Lynch every criminal and evildoer."
    },
    Lookout: {
        summary: "You are an eagle-eyed observer, stealthily camping outside houses to gain information",
        abilities: "Investigate one person each night for a clue to their role.",
        attributes: "None",
        goal: "Lynch every criminal and evildoer."
    },
    Sheriff: {
        summary: "You are the law enforcer of the town forced into hiding from threat of murder.",
        abilities: "Interrogate one person each night for suspicious activity.",
        attributes: "You will know if your target is suspicious.",
        goal: "Lynch every criminal and evildoer."
    },
    Spy: {
        summary: "You are a talented watcher who keeps track of evil in the Town.",
        abilities: "You may bug a player's house to see what happens to them that night.",
        attributes: "You will know who the Mafia visit each night.",
        goal: "Lynch every criminal and evildoer."
    },
    Jailor: {
        summary: "You are a prison guard who secretly detains suspects.",
        abilities: "You may choose one person during the day to Jail for the night.",
        attributes: "You may anonymously talk with your prisoner.\n You can choose to attack your prisoner.\nThe jailed target can't perform their night ability.\nIf you execute a Town member, you forfeit further executions.",
        goal: "Lynch every criminal and evildoer."
    },
    Veteran: {
        summary: "You are a paranoid war hero who will shoot anyone who visits you.",
        abilities: "Decide if you will go on alert.",
        attributes: "While on alert you gain Basic Defense.\nWhile on alert, you will deliver a Powerful attack to anyone who visits you.\nYou can only go on alert 3 times.\nYou cannot be role blocked.",
        goal: "Lynch every criminal and evildoer."
    },
    Vigilante: {
        summary: "You are a militant cop who takes the law into your own hands.",
        abilities: "Choose to take justice into your own hands and shoot someone.",
        attributes: "If you shoot another Town member you will commit suicide over the guilt.\nYou can only shoot your gun 3 times.",
        goal: "Lynch every criminal and evildoer."
    },
    Bodyguard: {
        summary: "You are an ex-soldier who secretly makes a living by selling protection.",
        abilities: "Protect a player from direct attacks at night.",
        attributes: "If your target is directly attacked or is the victim of a harmful visit, you and the visitor will fight.\nIf you successfully protect someone you can still be Healed.",
        goal: "Lynch every criminal and evildoer."
    },
    Doctor: {
        summary: "You are a surgeon skilled in trauma care who secretly heals people.",
        abilities: "Heal one person each night, granting them Powerful defense.",
        attributes: "You may only Heal yourself once.\nYou will know if your target is attacked.",
        goal: "Lynch every criminal and evildoer."
    },
    Escort: {
        summary: "You are a beautiful person skilled in distraction.",
        abilities: "Distract someone each night.",
        attributes: "Distraction blocks your target from using their role's night ability.\nYou cannot be role blocked.",
        goal: "Lynch every criminal and evildoer."
    },
    Mayor: {
        summary: "You are the leader of the town.",
        abilities: "You may reveal yourself as the Mayor of the Town.",
        attributes: "Once you have revealed yourself as Mayor your vote counts as 3 votes.\nYou may not be Healed once you have revealed yourself.\nOnce revealed, you can't whisper, or be whispered to.",
        goal: "Lynch every criminal and evildoer."
    },
    Medium: {
        summary: "You are a secret psychic who talks with the dead.",
        abilities: "When dead send a vision to a living person.",
        attributes: "You will speak to the dead anonymously each night you are alive.\nYou may only speak to a living person once.",
        goal: "Lynch every criminal and evildoer."
    },
    Retributionist: {
        summary: "You are a powerful mystic that can raise the true-hearted dead.",
        abilities: "You may raise a dead Town member and use their ability on a player.",
        attributes: "Create zombies from dead true-hearted Town players.\nUse their abilities on your second target.\nEach zombie can be used once before it rots.",
        goal: "Lynch every criminal and evildoer.",
    },
    Transporter: {
        summary: "Your job is to transport people without asking any questions.",
        abilities: "Choose two people to transport at night.",
        attributes: "Transporting two people swaps all targets against them.\nYou may transport yourself.\nYour targets will know they were transported.",
        goal: "Lynch every criminal and evildoer."
    },
    Disguiser: {
        summary: "You are a master of disguise who can make people appear to be someone they are not.",
        abilities: "Disguise a mafia member as a non-mafia member to alter their identity.",
        attributes: "The disguised Mafia member will appear to have the same role as the non-Mafia member to the Investigator and Sheriff.\nYour disguised Mafia member will appear to be the other person to a Lookout.\nWhen disguised as a Town member, Mafia visits are disregarded by Spy.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Forger: {
        summary: "You are a crooked lawyer that replaces documents.",
        abilities: "Choose a person and rewrite their last will at night.",
        attributes: "If your target dies their last will is replaced with your forgery and their role will be shown as the role you select to forge.\nYou may only perform 2 forgeries.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Framer: {
        summary: "You are a skilled counterfeiter who manipulates information.",
        abilities: "Choose someone to frame at night.",
        attributes: "If your target is investigated they will appear suspicious.\nIf there are no kill capable Mafia roles left you will become a Mafioso.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Hypnotist: {
        summary: "You are a skilled hypnotist who can alter the perception of others.",
        abilities: "You may sneak into a players house at night and plant a memory.",
        attributes: "A planted memory will confuse the player.\nIf there are no kill capable Mafia roles left you will become a Mafioso.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Janitor: {
        summary: "You are a sanitation expert working for organized crime.",
        abilities: "Choose a person to clean at night.",
        attributes: "If your target dies their role and last will won't be revealed to the Town.\nOnly you will see the cleaned targets role and last will.\nYou may only perform 3 cleanings.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Ambusher: {
        summary: "You are a stealthy killer who lies in wait for the perfect moment to strike",
        abilities: "You may choose to lie in wait outside your targets house.",
        attributes: "You will attack one player who visits your target. All players visiting your target will learn your name.\nIf there are no kill capable Mafia roles left you will become a Mafioso.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Godfather: {
        summary: "You are the leader of organized crime.",
        abilities: "You may choose to attack a player each night.",
        attributes: "If there is a Mafioso he will attack the target instead of you.\nYou will appear to be innocent to the Sheriff.\nYou can talk with the other Mafia at night.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Mafioso: {
        summary: "You are a member of organized crime, trying to work your way to the top.",
        abilities: "Carry out the Godfather's orders.",
        attributes: "You can attack if the Godfather doesn't give you orders.\nIf the Godfather dies you will become the next Godfather.\nYou can talk with the other Mafia at night.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Blackmailer: {
        summary: "You are an eavesdropper who uses information to keep people quiet.",
        abilities: "Choose one person each night to blackmail.",
        attributes: "Blackmailed targets cannot talk during the day.\nYou can hear private messages.\nIf there are no kill capable Mafia roles left you will become a Mafioso.\nYou can talk with the other Mafia at night.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Consigliere: {
        summary: "You are a corrupted investigator who gathers information for the Mafia.",
        abilities: "Check one person for their exact role each night.",
        attributes: "If there are no kill capable Mafia roles left you will become a Mafioso.\nYou can talk with the other Mafia at night.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Consort: {
        summary: "You are a beautiful dancer working for organized crime.",
        abilities: "Distract someone each night.",
        attributes: "Distraction blocks your target from using their role's night ability.\nIf there are no kill capable Mafia roles left you will become a Mafioso.\nYou can talk with the other Mafia at night.",
        goal: "Kill anyone that will not submit to the Mafia."
    },
    Executioner: {
        summary: "You are an obsessed lyncher who will stop at nothing to execute your target.",
        abilities: "Trick the Town into lynching your target.",
        attributes: "If your target is killed at night you will become a Jester.",
        goal: "Get your target lynched at any cost."
    },
    Jester: {
        summary: "You are a crazed lunatic whose life goal is to be publicly executed.",
        abilities: "Trick the Town into voting against you.",
        attributes: "If you are lynched you will attack one of your guilty or abstaining voters the following night with an Unstoppable attack.",
        goal: "Get yourself lynched by any means necessary."
    },
    Witch: {
        summary: "You are a voodoo master who can control other peoples actions.",
        abilities: "Control someone each night.",
        attributes: "You have a mystical barrier that grants you Basic defense until you are attacked.\nYou will know the role of the player you Control.",
        goal: "Survive to see the Town lose the game."
    }

}

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
            let msgToSend = player.faction == "Executioner" ? `Welcome to Mafia! Your role is ${player.role} this game.\nYour target this game is ${gameCache.inGameRoles.find(target => target.id == player.targetID).displayName}.` : `Welcome to Mafia! Your role is ${player.role} this game.`;
            if (player.faction == "Mafia") msgToSend += "\nYou are a mafia member this game! This means that you have access to a mafia-only chat wherein you will be able to communicate with your fellow mafia members at night. You will also choose your nightly targets in that channel.";
            msgToSend += `\nThe following is a description of your role:\n\`\`\`${player.role}:\nSummary: ${roleDescriptions[player.role].summary}\nAbilities: ${roleDescriptions[player.role].abilities}\nAttributes: ${roleDescriptions[player.role].attributes}\nGoal: ${roleDescriptions[player.role].goal}\`\`\``;
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