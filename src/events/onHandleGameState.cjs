//A backend listener that handles all the necessary state changes. This exists in an inbetween phase, before gameDaytime and after gameNighttime

const { Collection } = require("discord.js");
const {uniqWith, isEqual} = require("lodash");

const messageOptions = {

    transport: "You were transported to another location.",
    guard: "You were attacked but someone protected you!",
    block: "Someone occupied your night. You were role blocked!",
    heal: "You were attacked but someone nursed you back to health",
    witch: "You feel a mystical power dominating you. You were controlled by a Witch!",

    role_bodyguard: "Your target is a trained protector. They must be a Bodyguard.",
    role_doctor: "Your target is a professional surgeon. They must be a Doctor.",
    role_escort: "Your target is a beautiful person working for the town. They must be an Escort.",
    role_investigator: "Your target gathers information about people. They must be an Investigator.",
    role_jailor: "Your target detains people at night. They must be a Jailor.",
    role_lookout: "Your target watches who visits people at night. They must be a Lookout.",
    role_mayor: "Your target is the leader of the town. They must be the Mayor.",
    role_medium: "Your target speaks with the dead. They must be a Medium.",
    role_retributionist: "Your target wields mystical powers. They must be a Retributionist.",
    role_sheriff: "Your target is a protector of the town. They must be a Sheriff.",
    role_spy: "Your target secretly watches who someone visits. They must be a Spy.",
    role_transporter: "Your target specializes in transportation. They must be a Transporter.",
    role_veteran: "Your target is a paranoid war hero. They must be a Veteran.",
    role_vigilante: "Your target will bend the law to enact justice. They must be a Vigilante.",
    role_ambusher: "Your target lies in wait. They must be an Ambusher.",
    role_blackmailer: "Your target uses information to silence people. They must be a Blackmailer.",
    role_consigliere: "Your target gathers information for the Mafia. They must be a Consigliere.",
    role_consort: "Your target is a beautiful person working for the Mafia. They must be a Consort",
    role_disguiser: "Your target makes other people appear to be someone they're not. They must be a Disguiser.",
    role_forger: "Your target is good at forging documents. They must be a Forger.",
    role_framer: "Your target has a desire to deceive. They must be a Framer!",
    role_godfather: "Your target is the leader of the Mafia. They must be the Godfather",
    role_hypnotist: "Your target is skilled at disrupting others. They must be a Hypnotist",
    role_janitor: "Your target cleans up dead bodies. They must be a Janitor",
    role_mafioso: "Your target does the Godfather's dirty work. They must be a Mafioso.",
    role_witch: "Your target casts spells on people. They must be a witch",
    role_executioner: "Your target wants someone to be lynched at any cost. They must be an Executioner"
};

const investigatorBrackets = [["Veteran", "Vigilante", "Ambusher", "Mafioso"], ["Medium", "Janitor", "Retributionist"], ["Spy", "Blackmailer", "Jailor"], ["Framer", "Jester"], ["Lookout", "Forger", "Witch"], ["Escort", "Transporter", "Consort", "Hypnotist"], ["Doctor", "Disguiser"], ["Sheriff", "Executioner"], ["Investigator", "Consigliere", "Mayor"], ["Bodyguard", "Godfather"]];

const statusCodes = {
    0: "Your target was transported to another location.",
    1: "Someone occupied your target's night. They were role blocked!",
    2: "Someone threatened to reveal your target's secrets. They were blackmailed!",
    3: "Your target was attacked but someone fought off their attacker!",
    4: "Your target was attacked but someone nursed them back to health!",
    5: "Your target was attacked by a member of the Mafia!",
    6: "Your target was shot by a Vigilante!",
    7: "Your target was shot by the Veteran they visited!",
    8: "Your target was killed protecting someone!",
    9: "Your target's target was attacked last night!",
    10: "A Bodyguard attacked your target but someone nursed them back to health!",
    11: "Your target was killed by a Bodyguard!",
    12: "Someone attacked your target but their defense was too strong",
    13: "Someone tried to roleblock your target but they were immune!",
    14: "Your target was controlled by a witch!",
    15: "A Witch tried to control your target but they were immune.",
    16: "Your target was haunted by the Jester and committed suicide!",
    17: "Your target was attacked but their bulletproof vest saved them!",
    18: "Someone tried to attack your alert target and failed!",
    19: "Your target shot themselves over the guilt of killing a town member!"
}

module.exports = function(client){
    client.on("handleGameState", async (guildID, channelID) => {
        //TODO: figure out who's dead, manage permissions at a user-based level
        const gameCache = client.games.get(guildID).get(channelID);

        let targetMap = createTargetMap(client, guildID, channelID);
        let publicAPIMap = createPublicAPIMap(client, guildID, channelID);
        let publicPlayerInformationMap = createPublicPlayerInformationMap(client, guildID, channelID);
        
        let actionTracker = gameCache.inGameRoles.filter(player => player.alive && !player.jailed && player.priority).sort((a, b) => a.priority - b.priority);

        /*
        Get a list of what happens to every single player.

        First, we populate a map that maps player ids to all the information about players that have visited them.

        Then, we iterate through that map, storing info about which players visited who.

        Then, resolve messages and lasting state changes.

        Then, reset all the state.
        */

        //might be a good idea to handle all messages separately to avoid clutter. <-YES DO THIS 
        //also set the 
        let transportedPlayerArray = [];
        let findGuiltyVigilante = false;
        for (let player of actionTracker){
            switch (player.role){
                case "Retributionist": {
                    if (!(player.targets.first && player.targets.second)) break;
                    const ressurectTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.second);
                    if (targetMap.get(target.id).get(ressurectTarget.role.toLowerCase())){
                        targetMap.get(target.id).get(ressurectTarget.role.toLowerCase()).push(player.id); 
                    } else {
                        targetMap.get(target.id).set(ressurectTarget.role.toLowerCase(), [player.id]);
                    }

                    if (targetMap.get(target.id).get("all")){
                        targetMap.get(target.id).get("all").push(player.id);
                    } else {
                        targetMap.get(target.id).set("all", [player.id]);
                    }
                    break;
                }
                case "Transporter": {
                    if (!(player.targets.first && player.targets.second)) break;
                    const firstTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    const secondTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.second);

                    //The idea is we can take all the players that visit the first player and have them instead visit the second player, vice versa.

                    if (targetMap.get(firstTarget.id).get("transporter")){
                        targetMap.get(firstTarget.id).get("transporter").push(player.id);
                    } else {
                        targetMap.get(firstTarget.id).set("transporter", [player.id]);
                    }

                    if (targetMap.get(secondTarget.id).get("transporter")){
                        targetMap.get(secondTarget.id).get("transporter").push(player.id);
                    } else {
                        targetMap.get(secondTarget.id).set("transporter", [player.id]);
                    }

                    if (targetMap.get(firstTarget.id).get("all")){
                        targetMap.get(firstTarget.id).get("all").push(player.id);
                    } else {
                        targetMap.get(firstTarget.id).set("all", [player.id]);
                    }

                    if (targetMap.get(secondTarget.id).get("all")){
                        targetMap.get(secondTarget.id).get("all").push(player.id);
                    } else {
                        targetMap.get(secondTarget.id).set("all", [player.id]);
                    }
                    if (firstTarget.jailed || secondTarget.jailed) break;

                    transportedPlayerArray.push([firstTarget.id, secondTarget.id]);
                        
                    break;
                }
                case "Witch": {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    targetMap.get(target.id).set("witch", [player.id]);

                    if (targetMap.get(target.id).get("all")){
                        targetMap.get(target.id).get("all").push(player.id);
                    } else {
                        targetMap.get(target.id).set("all", [player.id]);
                    }

                    if (target.priority < player.priority || player.jailed || player.role == "Transporter" || (player.limitedUses.limited && player.limitedUses.uses <= 0)) break; 

                    if (target.role == "Godfather"){
                        const mafiosoPlayer = actionTracker.find(player => player.role == "Mafioso");
                        if (mafiosoPlayer) mafiosoPlayer.targets.first = player.targets.second;
                    } if (target.role == "Mafioso"){
                        const godfatherPlayer = actionTracker.find(player => player.role == "Godfather");
                        if (godfatherPlayer && godfatherPlayer.targets.first) break;
                    }

                    target.targets.first = player.targets.second; 
                    break;
                }
                case "Escort": case "Consort": {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);

                    if (targetMap.get(target.id).get(player.role.toLowerCase())) {
                        targetMap.get(target.id).get(player.role.toLowerCase()).push(player.id);
                    } else {
                        targetMap.get(target.id).set(player.role.toLowerCase(), [player.id]);
                    }
                  
                    if (targetMap.get(target.id).get("all")) {
                        targetMap.get(target.id).get("all").push(player.id);
                    } else {
                        targetMap.get(target.id).set("all", [player.id]);
                    }

                    if (target.priority <= player.priority || target.jailed || player.role == "Transporter") break; 

                    const godfatherPlayer = gameCache.inGameRoles.find(player => player.role == "Godfather" && player.alive);
                    if (target.role == "Mafioso" && godfatherPlayer){
                        godfatherPlayer.targets = target.targets;
                    }

                    target.targets = {first: false, second: false, binary: false, options: false};

                    break;
                }
                case "Disguiser": {
                    if (!(player.targets.first && player.targets.second)) break;
                    const mafiaTarget = gameCache.inGameRoles.find(target => target.id == player.targets.first);
                    const townTarget = gameCache.inGameRoles.find(target => target.id == player.targets.second);

                    if (targetMap.get(mafiaTarget.id).get("disguiser")) {
                        targetMap.get(mafiaTarget.id).get("disguiser").push(player.id);
                    } else {
                        targetMap.get(mafiaTarget.id).set("disguiser", [player.id]);
                    }

                    if (targetMap.get(townTarget.id).get("disguiser")) {
                        targetMap.get(townTarget.id).get("disguiser").push(player.id);
                    } else {
                        targetMap.get(townTarget.id).set("disguiser", [player.id]);
                    }
                   
                    if (targetMap.get(mafiaTarget.id).get("all")) {
                        targetMap.get(mafiaTarget.id).get("all").push(player.id);
                    } else {
                        targetMap.get(mafiaTarget.id).set("all", [player.id]);
                    }

                    if (targetMap.get(townTarget.id).get("all")) {
                        targetMap.get(townTarget.id).get("all").push(player.id);
                    } else {
                        targetMap.get(townTarget.id).set("all", [player.id]);
                    }
                    
                    if (townTarget.jailed) break;
                    publicPlayerInformationMap.get(mafiaTarget.id).set("publicID", townTarget.id);
                    publicPlayerInformationMap.get(mafiaTarget.id).set("publicRole", townTarget.role);
                    publicPlayerInformationMap.get(mafiaTarget.id).set("publicInnocent", townTarget.faction == "Mafia" && townTarget.role != "Godfather" ? false : true);
                    break;
                }
                case "Framer": {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(target => target.id == player.targets.first);

                    if (targetMap.get(target.id).get("framer")) {
                        targetMap.get(target.id).get("framer").push(player.id);
                    } else {
                        targetMap.get(target.id).set("framer", [player.id]);
                    }

                    if (targetMap.get(target.id).get("all")) {
                        targetMap.get(target.id).get("all").push(player.id);
                    } else {
                        targetMap.get(target.id).set("all", [player.id]);
                    }
                    if(target.jailed) break;
                    publicPlayerInformationMap.get(target.id).set("publicRole", "Framer");
                    publicPlayerInformationMap.get(target.id).set("publicInnocent", false);

                    break;
                }
                case "Jailor": {
                    if (!player.targets.first) break;
                    const executed = player.targets.binary;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    targetMap.get(target.id).set("jailed", [player.id]);
                    if (executed) {
                        targetMap.get(target.id).set("executed", [player.id]);

                        if (target.faction == "Town"){
                            player.limitedUses.uses = 0;
                        } else {
                            --player.limitedUses.uses;
                        }
                    }
                    break;
                }
                case "Veteran": {
                    if (player.targets.binary){
                        console.log("yep");
                        --player.limitedUses.uses;
                    }
                    break;
                }
                case "Vigilante": {
                    if (player.limitedUses.uses == -1){
                        console.log("vigilante should die");
                        findGuiltyVigilante = true;
                    } 
                    if (!player.targets.first) break; 
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first); 

                    --player.limitedUses.uses;

                    if (targetMap.get(target.id).get("killing")){
                        targetMap.get(target.id).get("killing").push(player.id);
                    } else {
                        targetMap.get(target.id).set("killing", [player.id]);
                    }

                    if (targetMap.get(target.id).get("all")){
                        targetMap.get(target.id).get("all").push(player.id);
                    } else {
                        targetMap.get(target.id).set("all", [player.id]);
                    }
                    break;
                }
                case "Mafioso": {
                    let godfatherPlayer = actionTracker.find(player => player.role == "Godfather");
                    let target;

                    //indicates role blocked
                    if (!player.targets.first) break; 

                    if (godfatherPlayer && godfatherPlayer?.targets.first){
                        target = gameCache.inGameRoles.find(player => player.id == godfatherPlayer.targets.first); 
                    } else {
                        target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first); 
                    }

                    if (targetMap.get(target.id).get("killing")){
                        targetMap.get(target.id).get("killing").push(player.id);
                    } else {
                        targetMap.get(target.id).set("killing", [player.id]);
                    }

                    if (targetMap.get(target.id).get("all")){
                        targetMap.get(target.id).get("all").push(player.id);
                    } else {
                        targetMap.get(target.id).set("all", [player.id]);
                    }

                    break;
                }
                case "Godfather": {
                    let mafiosoPlayer = actionTracker.find(player => player.role == "Mafioso");

                    if (mafiosoPlayer?.targets.first) break;    
                    if (!player.targets.first) break;

                    let targetID = player.targets.first;

                    if (targetMap.get(targetID).get("killing")){
                        targetMap.get(targetID).get("killing").push(player.id);
                    } else {
                        targetMap.get(targetID).set("killing", [player.id]);
                    }

                    if (targetMap.get(targetID).get("all")){
                        targetMap.get(targetID).get("all").push(player.id);
                    } else {
                        targetMap.get(targetID).set("all", [player.id]);
                    }
                   
                    break;
                }
                case "Doctor": case "Bodyguard": {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first); 

                    if (player === target){
                        player.defense = 1;
                        --player.limitedUses.uses;
                        break;
                    }

                    if (targetMap.get(target.id).get(player.role.toLowerCase())){
                        targetMap.get(target.id).get(player.role.toLowerCase()).push(player.id);
                    } else {
                        targetMap.get(target.id).set(player.role.toLowerCase(), [player.id]);
                    }

                    if (targetMap.get(target.id).get("all")){
                        targetMap.get(target.id).get("all").push(player.id);
                    } else {
                        targetMap.get(target.id).set("all", [player.id]);
                    }

                    break; 
                }
                default: {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first); 

                    if (targetMap.get(target.id).get(player.role.toLowerCase())){
                        targetMap.get(target.id).get(player.role.toLowerCase()).push(player.id);
                    } else {
                        targetMap.get(target.id).set(player.role.toLowerCase(), [player.id]);
                    }

                    if (targetMap.get(target.id).get("all")){
                        targetMap.get(target.id).get("all").push(player.id);
                    } else {
                        targetMap.get(target.id).set("all", [player.id]);
                    }

                    break;
                }
            }
        }

        for (let [firstPlayerID, secondPlayerID] of transportedPlayerArray){
            const tempFirstTargetMap = targetMap.get(firstPlayerID);
            targetMap.set(firstPlayerID, targetMap.get(secondPlayerID));
            targetMap.set(secondPlayerID, tempFirstTargetMap);
        }

        //Now, we have to resolve the messages that each player will have to see. Also, we will need to handle any lasting state effects (death, blackmailing)

        //put all the new players who died here
        let newDeaths = [];

        if (findGuiltyVigilante){
            let guiltyPlayerArray = actionTracker.filter(player => player.role == "Vigilante" && player.limitedUses.uses == -1);
            for (let guiltyPlayer of guiltyPlayerArray){
                newDeaths.push([guiltyPlayer, "guilt"]);
                publicAPIMap.get(guiltyPlayer.id).get("messages").push("You could not get over the guilt of killing a town member. You shot yourself!");
                publicAPIMap.get(guiltyPlayer.id).get("statusCodes").push(19);
            }
        }

        //DRY player.jailed
        //This for loop should be used to push messages into messages, and to handle state changes that are irrelevant to what messages each player will see upon using their abilities.
        for (const player of gameCache.inGameRoles.filter(player => player.alive)){
            for (let [visitedByRole, playerIDs] of targetMap.get(player.id)){
                if (visitedByRole == "all" || !playerIDs) continue;
                if (player.role == "Veteran" && player.targets.binary && visitedByRole != "executed"){
                    for (const visitingPlayerID of playerIDs){
                        publicAPIMap.get(player.id).get("messages").push("You shot someone who visited you last night!");

                        if (visitedByRole == "killing"){
                            publicAPIMap.get(player.id).get("messages").push("Someone tried to attack you but your defense while on alert was too strong!");
                            publicAPIMap.get(player.id).get("statusCodes").push(18);
                        }

                        publicAPIMap.get(visitingPlayerID).get("messages").push("You were shot by the Veteran you visited!");
                        publicAPIMap.get(visitingPlayerID).get("statusCodes").push(7);

                        newDeaths.push([gameCache.inGameRoles.find(player => player.id == visitingPlayerID), "veteran"]);
                    }

                    continue;
                }
                switch (visitedByRole){
                    case "executed": {
                            newDeaths.push([player, "executed"]);
                            publicAPIMap.get(player.id).get("messages").push("You were executed by the Jailor. You have died!");
                            break;
                    }
                    case "investigator":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            }
                        } else {
                            for (const visitingPlayerID of playerIDs){
                                const possibleRoles = investigatorBrackets.find(arr => arr.includes(publicPlayerInformationMap.get(player.id).get("publicRole")));
                                publicAPIMap.get(visitingPlayerID).get("messages").push(`Your player could be a ${possibleRoles.join("/")}.`);
                                publicAPIMap.get(visitingPlayerID).get("investigativeMessages").push(`The player you witched found their target could be a ${possibleRoles.join("/")}.`);
                            }
                        }
                        break;
                    case "lookout":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            }
                        } else {
                            for (const visitingPlayerID of playerIDs){
                                for (const allVisitorID of targetMap.get(player.id).get("all")){
                                    if (allVisitorID == visitingPlayerID) continue;
                                    let publicPlayer = gameCache.inGameRoles.find(player => player.id == publicPlayerInformationMap.get(allVisitorID).get("publicID"));
                                    publicAPIMap.get(visitingPlayerID).get("messages").push(`Your target was visited by ${publicPlayer.tag}`);
                                    publicAPIMap.get(visitingPlayerID).get("investigativeMessages").push(`The player you witched found their target was visited by ${publicPlayer.tag}.`);
                                }
                            }
                        }
                        break;
                    case "sheriff":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            } 
                        } else {
                            for (const visitingPlayerID of playerIDs){
                                const message = publicPlayerInformationMap.get(player.id).get("publicInnocent") ? "You cannot find evidence of wrongdoing. Your target seems innocent." : "Your target is suspicious!";
                                const witchMessage = message.split(" ")[0] == "You" ? "The player you witched found that their target is innocent." : "The player you witched found that their target is suspicious."
                                publicAPIMap.get(visitingPlayerID).get("messages").push(message);
                                publicAPIMap.get(visitingPlayerID).get("investigativeMessages").push(witchMessage);
                            }
                        }
                        break;
                    case "spy":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            }
                        } else {
                            for (const visitingPlayerID of playerIDs){
                                //save a reference to the array.
                                publicAPIMap.get(visitingPlayerID).get("messages").unshift(publicAPIMap.get(player.id).get("statusCodes"));
                            }
                        } 
                        break;
                    case "killing":
                        for (const [index, visitingPlayerID] of playerIDs.entries()){
                            if (["Mafioso", "Godfather"].includes(gameCache.inGameRoles.find(player => player.id == visitingPlayerID).role)){
                                for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                    publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`);
                                }
                            }
                            if (player.jailed){
                                for (const visitingPlayerID of playerIDs){
                                    publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                                    publicAPIMap.get(player.id).get("messages").push("Someone tried to attack but you were in jail last night!");
                                }
                            } else if (targetMap.get(player.id).get("bodyguard")[index]){
                                let bodyguardID = targetMap.get(player.id).get("bodyguard")[index];

                                publicAPIMap.get(player.id).get("messages").push("You were attacked but someone fought off your attacker!");
                                publicAPIMap.get(player.id).get("statusCodes").push(3);
                                    
                                if (targetMap.get(bodyguardID).get("doctor")){
                                    let doctorID = targetMap.get(bodyguardID).get("doctor")[0]; 

                                    publicAPIMap.get(bodyguardID).get("messages").push("Your target was attacked last night!", "You were attacked but someone nursed you back to health!");
                                    publicAPIMap.get(bodyguardID).get("statusCodes").push(4, 9);

                                    publicAPIMap.get(doctorID).get("messages").push("Your target was attacked last night!");
                                    publicAPIMap.get(doctorID).get("statusCodes").push(9);

                                    publicAPIMap.get(visitingPlayerID).get("messages").push("Your target's defense was too strong to kill.");
                                } else {
                                    publicAPIMap.get(bodyguardID).get("messages").push("You were killed protecting your target!");
                                    publicAPIMap.get(bodyguardID).get("statusCodes").push(8);

                                    newDeaths.push([actionTracker.find(player => player.id == bodyguardID), "bodyguard"]);
                                }

                                if (targetMap.get(visitingPlayerID).get("doctor")) {
                                    let doctorID = targetMap.get(visitingPlayerID).get("doctor")[0]; 

                                    publicAPIMap.get(visitingPlayerID).get("messages").push("A Bodyguard attacked you but someone nursed you back to health!");
                                    publicAPIMap.get(visitingPlayerID).get("statusCodes").get("statusCodes").push(10);

                                    publicAPIMap.get(doctorID).get("messages").push("Your target was attacked last night!");
                                    publicAPIMap.get(doctorID).get("statusCodes").push(9);  
                                } else {
                                    publicAPIMap.get(visitingPlayerID).get("messages").push("You were killed by a Bodyguard!");
                                    publicAPIMap.get(visitingPlayerID).get("statusCodes").push(11); 

                                    newDeaths.push(actionTracker.find([player => player.id == visitingPlayerID, "defender"]));
                                }
                            } else if (player.defense) {
                                if (player.role == "Witch") player.defense = 0;
                                if (player.role == "Doctor"){
                                    publicAPIMap.get(player.id).get("messages").push("You were attacked but someone nursed you back to health!");
                                    publicAPIMap.get(player.id).get("statusCodes").push(4, 9);
                                } else {
                                    publicAPIMap.get(visitingPlayerID).get("messages").push("Your target's defense was too strong to kill.");
                                    publicAPIMap.get(player.id).get("messages").push("Someone attacked you but your defense was too strong!");
                                    if (player.role == "Bodyguard") publicAPIMap.get(player.id).get("statusCodes").push(17);
                                    else publicAPIMap.get(player.id).get("statusCodes").push(12);
                                }
                            } else if (targetMap.get(player.id).get("doctor")){
                                publicAPIMap.get(player.id).get("messages").push("You were attacked but someone nursed you back to health!");
                                publicAPIMap.get(player.id).get("statusCodes").push(4); 

                                let doctorID = targetMap.get(player.id).get("doctor")[0]; 
                                publicAPIMap.get(doctorID).get("messages").push("Your target was attacked last night!");
                                publicAPIMap.get(doctorID).get("statusCodes").push(9); 
                            } else {
                                if (gameCache.inGameRoles.find(player => player.id == visitingPlayerID).role == "Vigilante"){
                                    if (player.faction == "Town") {
                                        const vigilantePlayer = gameCache.inGameRoles.find(player => player.id == visitingPlayerID);
                                        vigilantePlayer.limitedUses.uses = -1;
                                    }
                                    newDeaths.push([player, "vigilante"]);
                                    publicAPIMap.get(player.id).get("messages").push("You were shot by a Vigilante! You have died!");
                                    publicAPIMap.get(player.id).get("statusCodes").push(6);
                                } else {
                                    newDeaths.push([player, "mafia"]);
                                    publicAPIMap.get(player.id).get("messages").push("You were attacked by a member of the Mafia! You have died!");
                                    publicAPIMap.get(player.id).get("statusCodes").push(5);
                                }
                            }
                        }
                        break;
                    case "bodyguard": case "doctor":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            }
                        }
                        break;
                    case "escort":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            }
                        } else if (player.priority <= 2 || player.role == "Transporter") {
                            publicAPIMap.get(player.id).get("messages").push("Someone tried to roleblock you but you're immune!");
                            publicAPIMap.get(player.id).get("statusCodes").push(13);
                        } else {
                            publicAPIMap.get(player.id).get("messages").push("Someone occupied your night. You were role blocked!");
                            publicAPIMap.get(player.id).get("statusCodes").push(1);    
                        }
                        break;
                    case "transporter":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                                publicAPIMap.get(player.id).get("messages").push("Someone tried to transport you but you were in jail!");
                            }
                        }
                        else {
                            for (const visitingPlayerID of playerIDs){ //eslint-disable-line
                                const transporterPlayer = gameCache.inGameRoles.find(player => player.id == visitingPlayerID);
                                const firstPlayer = transporterPlayer.targets.first, secondPlayer = transporterPlayer.targets.second;
                                if (firstPlayer.jailed || secondPlayer.jailed) break;
                                publicAPIMap.get(player.id).get("messages").push("You were transported to another location."); 
                                publicAPIMap.get(player.id).get("statusCodes").push(0);
                            }
                        }
                        break;
                    case "disguiser": case "forger": case "framer":
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`);
                            }
                            if (player.jailed) publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            else if (visitedByRole == "forger"){
                                --gameCache.inGameRoles.find(player => player.id == visitingPlayerID).limitedUses.uses; 
                            }
                        }  
                        break;
                    case "hypnotist":
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`);
                            }
                            if (player.jailed) {
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            } else {
                                publicAPIMap.get(player.id).get("messages").push(messageOptions[gameCache.inGameRoles.find(player => player.id == visitingPlayerID).targets.options]);
                            }
                        }  
                        break;
                   case "janitor":
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`);
                            }
                            if (player.jailed){
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            } else {
                                if (player.cleaned) player.cleaned.push(gameCache.inGameRoles.find(player => player.id == visitingPlayerID));
                                else player.cleaned = [gameCache.inGameRoles.find(player => player.id == visitingPlayerID)];

                                player.publicWill = "";
                                --gameCache.inGameRoles.find(player => player.id == visitingPlayerID).limitedUses.uses;
                            }
                        }   
                        break;
                    case "ambusher": {
                        const visitingPlayerID = playerIDs[0];
                        for (const spy of actionTracker.filter(player => player.role == "Spy")){
                            publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`);
                        }
                        if (player.jailed) {
                            publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"); 
                        } else {
                            let ambushedPlayersID = targetMap.get(player.id).get("all").filter(visitorID => gameCache.inGameRoles.find(gp => gp.id == visitorID).faction != 'Mafia');
                            const randomIndex = Math.floor(Math.random() * ambushedPlayersID.length);

                            for (const [index, ambushedPlayerID] of ambushedPlayersID.entries()){
                                if (index == randomIndex){
                                    if (targetMap.get(ambushedPlayerID).get("doctor")){
                                        publicAPIMap.get(visitingPlayerID).get("messages").push("You ambushed someone who visited your target last night!");

                                        publicAPIMap.get(ambushedPlayerID).get("messages").push("You were attacked but someone nursed you back to health!");
                                        publicAPIMap.get(ambushedPlayerID).get("statusCodes").push(4); 

                                        let doctorID = targetMap.get(ambushedPlayerID).get("doctor")[0]; 

                                        publicAPIMap.get(doctorID).get("messages").push("Your target was attacked last night!");
                                        publicAPIMap.get(doctorID).get("statusCodes").push(9); 
                                    } else if (gameCache.inGameRoles.find(player => player.id == ambushedPlayerID).defense){
                                        let player = gameCache.inGameRoles.find(player => player.id == ambushedPlayerID);
                                        player.defense = 0;

                                        if (player.role == "Witch") player.defense = 0;
                                        if (player.role == "Doctor"){
                                            publicAPIMap.get(player.id).get("messages").push("You were attacked but someone nursed you back to health!");
                                            publicAPIMap.get(player.id).get("statusCodes").push(4, 9);

                                            break;
                                        }

                                        publicAPIMap.get(visitingPlayerID).get("messages").push("You ambushed someone who visited your target last night!"); 
                                        publicAPIMap.get(visitingPlayerID).get("messages").push("Your target's defense was too strong to kill!"); 

                                        publicAPIMap.get(ambushedPlayerID).get("statusCodes").push(12);
                                        publicAPIMap.get(ambushedPlayerID).get("messages").push("Someone attacked you but your defense was too strong!");
                                    } else {
                                        newDeaths.push([gameCache.inGameRoles.find(player => player.id == ambushedPlayerID), "mafia"]);
                                        publicAPIMap.get(visitingPlayerID).get("messages").push("You ambushed someone who visited your target last night!");
                                        publicAPIMap.get(ambushedPlayerID).get("messages").push("You were attacked by a member of the Mafia! You have died!");
                                        publicAPIMap.get(ambushedPlayerID).get("statusCodes").push(5);
                                    }
                                } else {
                                    publicAPIMap.get(ambushedPlayerID).get("messages").push(`You saw ${gameCache.inGameRoles.find(player => player.id == visitingPlayerID).tag} prepare an ambush while visiting your target.`);
                                }
                            }
                        }
                        break;
                    }
                    case "blackmailer": {
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`);
                            }
                            if (player.jailed){ 
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                                publicAPIMap.get(player.id).get("messages").push("Someone tried to blackmail you but you were in jail!");
                            } else {
                                publicAPIMap.get(player.id).get("messages").push("Someone threatened to reveal your secrets. You are blackmailed!");
                                publicAPIMap.get(player.id).get("statusCodes").push(2);
                                player.blackmailed = true;
                            }
                        }  
                        break;
                    }
                    case "consigliere": {
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`);
                            }
                            if (player.jailed){ 
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            } else {
                                publicAPIMap.get(visitingPlayerID).get("messages").push(messageOptions[`role_${player.role.toLowerCase()}`]);
                            }
                        }  
                        break; 
                    }
                    case "consort":
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`);
                            }
                            if (player.jailed){ 
                                publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!");
                            } else if (player.priority <= 2 || player.role == "Transporter") {
                                publicAPIMap.get(player.id).get("messages").push("Someone tried to roleblock you but you're immune!");
                                publicAPIMap.get(player.id).get("statusCodes").push(13);
                            } else {
                                publicAPIMap.get(player.id).get("messages").push("Someone occupied your night. You were role blocked!");
                                publicAPIMap.get(player.id).get("statusCodes").push(1);    
                            }
                        }
                        break;
                    case "witch": {
                        let visitingPlayerID = playerIDs[0];
                        if (player.jailed){ 
                            publicAPIMap.get(visitingPlayerID).get("messages").push("Your target was in jail so you could not control them.");
                        } else if (player.priority < 2){
                            publicAPIMap.get(player.id).get("messages").push("A Witch tried to control you but you are immune.");
                            publicAPIMap.get(visitingPlayerID).get("messages").push(messageOptions[`role_${player.role.toLowerCase()}`]);
                        } else if (["Spy", "Investigator", "Sheriff", "Lookout"].includes(player.role)){
                            publicAPIMap.get(player.id).get("messages").push("You feel a mystical power dominating you. You were controlled by a Witch!");
                            publicAPIMap.get(visitingPlayerID).get("messages").push(messageOptions[`role_${player.role.toLowerCase()}`]);
                            publicAPIMap.get(visitingPlayerID).get("messages").push(publicAPIMap.get(player.id).get("investigativeMessages"));
                        } else {
                            publicAPIMap.get(player.id).get("messages").push("You feel a mystical power dominating you. You were controlled by a Witch!");
                            publicAPIMap.get(visitingPlayerID).get("messages").push(messageOptions[`role_${player.role.toLowerCase()}`]);
                        }
                        break;
                    }

                    default:
                        break;
                }
            }
        }

        //Jester
        const jesterPlayer = gameCache.inGameRoles.find(player => player.jester && player.targets.first);
        if (jesterPlayer){
            const hauntedPlayerID = jesterPlayer.targets.first;
            publicAPIMap.get(hauntedPlayerID).get("messages").push("You were haunted by the Jester. You committed suicide over the guilt!");
            publicAPIMap.get(hauntedPlayerID).get("statusCodes").push(16);
            newDeaths.push([gameCache.inGameRoles.find(player => player.id == hauntedPlayerID), "jester"]);

            jesterPlayer.canRevenge = false;
            jesterPlayer.targets.first = false;
        }

        uniqWith(newDeaths, isEqual);

        if (!newDeaths.length) ++gameCache.daysWithoutDeath;
        else gameCache.daysWithoutDeath = 0;
        
        for (const [player, _] of newDeaths){ //eslint-disable-line
            if (!player.cleaned) continue;
            for (const cleaningPlayer of player.cleaned){
                publicAPIMap.get(cleaningPlayer.id).get("messages").push(`You secretly know that your target's role was ${player.role}.`);
                publicAPIMap.get(cleaningPlayer.id).get("messages").push(player.will ? `You secretly know that your target's will was ${player.will}.` : `You secretly know that your target did not have a will.`); 
            }
        }

        //print all the messages.

        let allPlayerMessages = [];
        for (const player of gameCache.inGameRoles.filter(player => player.alive)){
            let outputMessage = "Here's what happened in the game tonight:";
            const messages = publicAPIMap.get(player.id).get("messages");

            console.log(messages);
            for (const message of messages){
                if (typeof message == "string"){
                    outputMessage = outputMessage.concat("\n", message);
                } else {
                    for (const statusCode of message){
                        console.log(typeof statusCode);
                        if (typeof statusCode == "string") outputMessage = outputMessage.concat("\n", statusCode);
                        else {outputMessage = outputMessage.concat("\n", statusCodes[statusCode]);}

                    }
                }       
            }

           if (outputMessage == "Here's what happened in the game tonight:") outputMessage = "You slept peacefully last night. (You didn't receive any messages!)"; 
            allPlayerMessages.push(client.users.cache.get(player.id).send(outputMessage));

        }

        newDeaths = newDeaths.map(death => [death[0].handleDeath(client, guildID, channelID), death[1]]);
        await Promise.all(allPlayerMessages);
        for (const death of newDeaths){
            await Promise.all(death);
        }

        //Reset temporary state
        for (const player of gameCache.inGameRoles.filter(player => player.alive)){
            player.targets = {
                first: false,
                second: false,
                binary: false,
                options: false
            }
            player.jailed = false;
            player.cleaned = false;
            player.publicWill = player.will;

            if (["Bodyguard", "Doctor"].includes(player.role)) player.defense = 0;
        }


        //Reset all the state for the day.
        //Includes targets,

        client.emit("gameDaytime", false, guildID, channelID, newDeaths);
    });
}


/*
Populates a map, mapping player IDs to the players that visited them the night before.

@param {Client} client
@param {guildID} guildID
@param {channelID} channelID
*/

//This map holds internal state (who visited every person)
function createTargetMap(client, guildID, channelID){
    const gameCache = client.games.get(guildID).get(channelID);
    let targetMap = new Collection();
    gameCache.inGameRoles.filter(player => player.alive).forEach(player => targetMap.set(player.id, new Collection([
        //each role name gets mapped to an array of players of that role that visited the current player. Role is the player's role; messages refers to the messages that will be sent to this player
        ["executed", false],
        ["investigator", false],
        ["lookout", false],
        ["sheriff", false],
        ["spy", false],
        ["bodyguard", false],
        ["doctor", false],
        ["escort", false],
        ["transporter", false],
        ["medium", false],
        ["killing", false],
        ["disguiser", false],
        ["forger", false],
        ["framer", false],
        ["hypnotist", false],
        ["janitor", false],
        ["ambusher", false],
        ["blackmailer", false],
        ["consigliere", false],
        ["consort", false],
        ["witch", false],  
        ["all", false]
    ])));

    return targetMap;
}

//This map holds public player information
function createPublicPlayerInformationMap(client, guildID, channelID){
    const gameCache = client.games.get(guildID).get(channelID);
    let publicPlayerInformationMap = new Collection();
    gameCache.inGameRoles.filter(player => player.alive).forEach(player => publicPlayerInformationMap.set(player.id, new Collection([
        //each role name gets mapped to an array of players of that role that visited the current player. Role is the player's role; messages refers to the messages that will be sent to this player
        ["publicID", player.id],
        ["publicRole", player.role],
        ["publicInnocent", player.faction == "Mafia" && player.role != "Godfather" ? false : true], 
    ])));

    return publicPlayerInformationMap;

}

//API for sending to the guild. Write-only.

function createPublicAPIMap(client, guildID, channelID){
    const gameCache = client.games.get(guildID).get(channelID);
    let publicAPIMap = new Collection();
    gameCache.inGameRoles.filter(player => player.alive).forEach(player => publicAPIMap.set(player.id, new Collection([
        //each role name gets mapped to an array of players of that role that visited the current player. Role is the player's role; messages refers to the messages that will be sent to this player
        ["messages", []],
        ["statusCodes", []], //This is specifically for the spy. We can store a reference to the array
        ["investigativeMessages", []]

    ])));

    return publicAPIMap;
}