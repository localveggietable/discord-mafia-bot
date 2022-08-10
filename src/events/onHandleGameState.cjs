//A backend listener that handles all the necessary state changes. This exists in an inbetween phase, before gameDaytime and after gameNighttime

const { Collection } = require("discord.js");
const {uniq} = require("lodash");

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

const investigatorBrackets = [["Veteran", "Vigilante", "Ambusher", "Mafioso"], ["Medium", "Janitor", "Retributionist"], ["Spy", "Blackmailer", "Jailor"], ["Framer", "Jester"], ["Lookout", "Forger", "Witch"], ["Escort", "Transporter", "Consort", "Hypnotist"], ["Doctor", "Disguiser"], ["Investigator", "Consigliere", "Mayor"], ["Bodyguard", "Godfather"]];

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
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);

        let targetMap = createTargetMap(client, guildID, channelID);
        let publicAPIMap = createPublicAPIMap(client, guildID, channelID);
        let publicPlayerInformationMap = createPublicPlayerInformationMap(client, guildID, channelID);
        
        let actionTracker = gameCache.inGameRoles.filter(player => player.alive && !player.jailed && player.priority && player.role != "Veteran").sort((a, b) => a.priority - b.priority);

        /*
        Get a list of what happens to every single player.

        First, we populate a map that maps player ids to all the information about players that have visited them.

        Then, we iterate through that map, storing info about which players visited who.

        Then, resolve messages and lasting state changes.

        Then, reset all the state.
        */

        //might be a good idea to handle all messages separately to avoid clutter. <-YES DO THIS 
        //also set the 
        for (let player of actionTracker){
            switch (player.role){
                case "Retributionist": {
                    if (!(player.targets.first && player.targets.second)) break;
                    const ressurectTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer == player.targets.second);
                    targetMap.get(target.id).set(ressurectTarget.role.toLowerCase(), targetMap.get(target.id).get(ressurectTarget.role.toLowerCase()) ? targetMap.get(target.id).get(ressurectTarget.role.toLowerCase()).push(player.id) : [player.id]);
                    targetMap.get(target.id).set("all", targetMap.get(target.id).get("all") ? targetMap.get(target.id).get("all").push(player.id) : [player.id]);
                    break;
                }
                case "Transporter": {
                    if (!(player.targets.first && player.targets.second)) break;
                    const firstTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    const secondTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer == player.targets.second);

                    //The idea is we can take all the players that visit the first player and have them instead visit the second player, vice versa.

                    targetMap.get(firstTarget.id).set("transporter", targetMap.get(firstTarget.id).get("transporter") ? targetMap.get(firstTarget.id).get("transporter").push(player.id) : [player.id]);
                    targetMap.get(secondTarget.id).set("transporter", targetMap.get(secondTarget.id).get("transporter") ? targetMap.get(secondTarget.id).get("transporter").push(player.id) : [player.id]);

                    targetMap.get(firstTarget.id).set("all", targetMap.get(firstTarget.id).get("all") ? targetMap.get(firstTarget.id).get("all").push(player.id) : [player.id]);
                    targetMap.get(secondTarget.id).set("all", targetMap.get(secondTarget.id).get("all") ? targetMap.get(secondTarget.id).get("all").push(player.id) : [player.id]);

                    if (firstTarget.jailed || secondTarget.jailed) break;
                        
                    const tempFirstTargetMap = targetMap.get(firstTarget.id);
                    targetMap.set(firstTarget.id, targetMap.get(secondTarget.id));
                    targetMap.set(secondTarget.id, tempFirstTargetMap);
                    break;
                }
                case "Witch": {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    targetMap.get(target.id).set("witch", [player.id]); 
                    targetMap.get(target.id).set("all", targetMap.get(target.id).get("all") ? targetMap.get(target.id).get("all").push(player.id) : [player.id]);

                    if (target.priority < player.priority || player.jailed || player.role == "Transporter") break; 

                    target.targets.first = player.targets.second; 
                    break;
                }
                case "Escort": case "Consort": {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    targetMap.get(target.id).set(player.role.toLowerCase(), targetMap.get(target.id).get(player.role.toLowerCase()) ? targetMap.get(target.id).get(player.role.toLowerCase()).push(player.id) : [player.id]); 
                    targetMap.get(target.id).set("all", targetMap.get(target.id).get("all") ? targetMap.get(target.id).get("all").push(player.id) : [player.id]);
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
                    targetMap.get(mafiaTarget.id).set("disguiser", targetMap.get(mafiaTarget.id).get("disguiser") ? targetMap.get(mafiaTarget.id).get("disguiser").push(player.id) : [player.id]);
                    targetMap.get(townTarget.id).set("disguiser", targetMap.get(mafiaTarget.id).get("disguiser") ? targetMap.get(mafiaTarget.id).get("disguiser").push(player.id) : [player.id]);

                    targetMap.get(mafiaTarget.id).set("all", targetMap.get(mafiaTarget.id).get("all") ? targetMap.get(mafiaTarget.id).get("all").push(player.id) : [player.id]);
                    targetMap.get(townTarget.id).set("all", targetMap.get(townTarget.id).get("all") ? targetMap.get(townTarget.id).get("all").push(player.id) : [player.id]);

                    if (townTarget.jailed) break;
                    publicPlayerInformationMap.get(mafiaTarget.id).set("publicID", townTarget.id);
                    publicPlayerInformationMap.get(mafiaTarget.id).set("publicRole", townTarget.role);
                    publicPlayerInformationMap.get(mafiaTarget.id).set("publicInnocent", townTarget.faction == "Mafia" && townTarget.role != "Godfather" ? true : false);
                    break;
                }
                case "Framer": {
                    if (!(player.targets.first && player.targets.second)) break;
                    const target = gameCache.inGameRoles.find(target => target.id == player.targets.first);
                    targetMap.get(target.id).set("framer", targetMap.get(target.id).get("framer") ? targetMap.get(target.id).get("framer").push(player.id) : [player.id]);

                    targetMap.get(target.id).set("all", targetMap.get(target.id).get("all") ? targetMap.get(target.id).get("all").push(player.id) : [player.id]);

                    if(target.jailed) break;
                    publicPlayerInformationMap.get(target.id).set("publicRole", "Framer");
                    publicPlayerInformationMap.get(target.id).set("publicInnocent", false);

                    break;
                }
                case "Jailor": {
                    if (!player.targets.first) break;
                    const executed = player.targets.boolean;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                    targetMap.get(target.id).set("jailed", [player.id]);
                    if (executed) {
                        targetMap.get(target.id).set("executed", [player.id]);
                    }
                    break;
                }
                case "Mafioso": case "Godfather": case "Vigilante": {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer == player.targets.first); 
                    targetMap.get(target.id).set("killing", targetMap.get(target.id).get("killing") ? targetMap.get(target.id).get("killing").push(player.id) : [player.id]);
                    targetMap.get(target.id).set("all", targetMap.get(target.id).get("all") ? targetMap.get(target.id).get("all").push(player.id) : [player.id]);
                    break;
                }
                default: {
                    if (!player.targets.first) break;
                    const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer == player.targets.first); 
                    targetMap.get(target.id).set(player.role.toLowerCase(), targetMap.get(target.id).get(player.role.toLowerCase()) ? targetMap.get(target.id).get(player.role.toLowerCase()).push(player.id) : [player.id]);
                    targetMap.get(target.id).set("all", targetMap.get(target.id).get("all") ? targetMap.get(target.id).get("all").push(player.id) : [player.id]);
                    break;
                }
            }
        }



    
    
        //Now, we have to resolve the messages that each player will have to see. Also, we will need to handle any lasting state effects (death, blackmailing)

        //put all the new players who died here
        let newDeaths = [];

        //DRY player.jailed
        //This for loop should be used to push messages into messages, and to handle state changes that are irrelevant to what messages each player will see upon using their abilities.
        for (const player of gameCache.inGameRoles.filter(player => player.alive)){
            for (let [visitedByRole, playerIDs] of targetMap.get(player.id)){
                if (visitedByRole == "all" || !playerIDs) continue;
                switch (visitedByRole){
                    case "executed": {
                            newDeaths.push(player);
                            publicAPIMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push("You were executed by the Jailor. You have died!"));

                            let jailorPlayer = gameCache.inGameRoles.find(player => player.role == "Jailor");
                            if (player.faction == "Town"){
                                jailorPlayer.limitedUses.uses = 0;
                            } else {
                                --jailorPlayer.limitedUses.uses;
                            }
                            break;
                    }
                    case "investigator":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            }
                        } else {
                            for (const visitingPlayerID of playerIDs){
                                const possibleRoles = investigatorBrackets.find(arr => arr.includes(publicPlayerInformationMap.get(player.id).get("publicRole")));
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push(`Your player could be a ${possibleRoles.join("/")}`));
                            }
                        }
                        break;
                    case "lookout":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            }
                        } else {
                            for (const visitingPlayerID of playerIDs){
                                for (const allVisitorID of targetMap.get(player.id).get("all")){
                                    if (allVisitorID == visitingPlayerID) continue;
                                    let publicPlayer = gameCache.inGameRoles.find(player => player.id == publicPlayerInformationMap.get(allVisitorID).get("publicID"));
                                    publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push(`Your target was visited by ${publicPlayer.tag}`))
                                }
                            }
                        }
                        break;
                    case "sheriff":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            } 
                        } else {
                            for (const visitingPlayerID of playerIDs){
                                const message = publicPlayerInformationMap.get(player.id).get("publicInnocent") ? "You cannot find evidence of wrongdoing. Your target seems innocent." : "Your target is suspicious!";
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push(message));
                            }
                        }
                        break;
                    case "spy":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            }
                        } else {
                            for (const visitingPlayerID of playerIDs){
                                //save a reference to the array.
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").unshift(publicAPIMap.get(player.id).get("statusCodes")));
                            }
                        } 
                        break;
                    case "killing":
                        for (const [index, visitingPlayerID] of playerIDs.entries()){
                            if (["mafioso", "godfather"].includes(visitedByRole)){
                                for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                    publicAPIMap.get(spy.id).set("messages", publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`));
                                }
                            }
                            if (player.jailed){
                                for (const visitingPlayerID of playerIDs){
                                    publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                                }
                            } else if (player.defense) {
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your target's defense was too strong to kill."));
                                publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push("Someone attacked you but your defense was too strong!"));
                                publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).set("statusCodes").push(12));
                            } else if (targetMap.get(player.id).get("doctor")){
                                publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push("You were attacked but someone nursed you back to health!"));
                                publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).set("statusCodes").push(4)); 

                                let doctorID = targetMap.get(player.id).get("doctor")[0]; 
                                publicAPIMap.get(targetMap.get(doctorID).get("doctor")[0]).set("messages", publicAPIMap.get(doctorID).get("messages").push("Your target was attacked last night!"));
                                publicAPIMap.get(doctorID).set("statusCodes", publicAPIMap.get(doctorID).set("statusCodes").push(9)); 
                            } else if (targetMap.get(player.id).get("bodyguard")[index]){
                                let bodyguardID = targetMap.get(player.id).get("bodyguard")[index];

                                publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push("You were attacked but someone fought off your attacker!"));
                                publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).set("statusCodes").push(3));
                                    
                                if (targetMap.get(bodyguardID).get("doctor")){
                                    let doctorID = targetMap.get(bodyguardID).get("doctor")[0]; 

                                    publicAPIMap.get(bodyguardID).set("messages", publicAPIMap.get(bodyguardID).get("messages").push("Your target was attacked last night!", "You were attacked but someone nursed you back to health!"));
                                    publicAPIMap.get(bodyguardID).set("statusCodes", publicAPIMap.get(bodyguardID).get("statusCodes").push(4, 9));

                                    publicAPIMap.get(doctorID).set("messages", publicAPIMap.get(doctorID).get("messages").push("Your target was attacked last night!"));
                                    publicAPIMap.get(doctorID).set("statusCodes", publicAPIMap.get(doctorID).set("statusCodes").push(9));

                                    publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your target's defense was too strong to kill."))
                                } else {
                                    publicAPIMap.get(bodyguardID).set("messages", publicAPIMap.get(bodyguardID).get("messages").push("You were killed protecting your target!"));
                                    publicAPIMap.get(bodyguardID).set("statusCodes", publicAPIMap.get(bodyguardID).get("statusCodes").push(8));
                                }

                                if (targetMap.get(visitingPlayerID).get("doctor")) {
                                    let doctorID = targetMap.get(visitingPlayerID).get("doctor")[0]; 

                                    publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("A Bodyguard attacked you but someone nursed you back to health!"));
                                    publicAPIMap.get(visitingPlayerID).set("statusCodes", publicAPIMap.get(visitingPlayerID).get("statusCodes").push(10));

                                    publicAPIMap.get(targetMap.get(doctorID).get("doctor")[0]).set("messages", publicAPIMap.get(doctorID).get("messages").push("Your target was attacked last night!"));
                                    publicAPIMap.get(doctorID).set("statusCodes", publicAPIMap.get(doctorID).set("statusCodes").push(9));  
                                } else {
                                    publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("You were killed by a Bodyguard!"));
                                    publicAPIMap.get(visitingPlayerID).set("statusCodes", publicAPIMap.get(visitingPlayerID).get("statusCodes").push(11)); 
                                }
                            } else {
                                if (player.faction == "Town" && visitedByRole == "vigilante"){
                                    const vigilantePlayer = gameCache.inGameRoles.find(player => player.id == visitingPlayerID);
                                    if (player.faction == "Town") vigilantePlayer.limitedUses.uses = 0;
                                    --vigilantePlayer.limitedUses.uses;

                                    publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push("You were shot by a Vigilante! You have died!"));
                                    publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).get("statusCodes").push(6));
                                } else {
                                    publicAPIMap.get(player.id).get("messages", publicAPIMap.get(player.id).get("messages").push("You were attacked by a member of the Mafia! You have died!"));
                                    publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).get("statusCodes").push(5));
                                }
                            }
                        }
                        break;
                    case "bodyguard":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            }
                        }
                        break;
                    case "doctor":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            }
                        }
                        break;
                    case "escort":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            }
                        } else if (player.priority <= 2 || player.role == "Transporter") {
                            publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push("Someone tried to roleblock you but you're immune!"));
                            publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).get("statusCodes").push(13));
                        } else {
                            publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push("Someone occupied your night. You were role blocked!"));
                            publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).get("statusCodes").push(1));    
                        }
                        break;
                    case "transporter":
                        if (player.jailed){
                            for (const visitingPlayerID of playerIDs){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                                publicAPIMap.get(player.id).set("messages"), publicAPIMap.get(player.id).get("messages").push("Someone tried to transport you but you were in jail!");
                            }
                        } else {
                            for (const _ of playerIDs){ //eslint-disable-line
                                publicAPIMap.get(player.id).set("messages"), publicAPIMap.get(player.id).get("messages").push("You were transported to another location."); 
                                publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).get("statusCodes").push(0));
                            }
                        }
                        break;
                    case "disguiser": case "forger": case "framer":
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).set("messages", publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`));
                            }
                            if (player.jailed) publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                        }  
                        break;
                    case "hypnotist":
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).set("messages", publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`));
                            }
                            if (player.jailed) {
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            } else {
                                publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push(gameCache.find(player => player.id == visitingPlayerID).targets.options));
                            }
                        }  
                        break;
                   case "janitor":
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).set("messages", publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`));
                            }
                            if (player.jailed){
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            } else {
                                player.publicRole = "Cleaned";
                                player.publicWill = "";
                                --gameCache.inGameRoles.find(player => player.id == visitingPlayerID).limitedUses.uses;
                            }
                        }   
                        break;
                    case "ambusher": {
                        const visitingPlayerID = playerIDs[0];
                        for (const spy of actionTracker.filter(player => player.role == "Spy")){
                            publicAPIMap.get(spy.id).set("messages", publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`));
                        }
                        if (player.jailed) {
                            publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!")); 
                        } else {
                            let ambushedPlayersID = targetMap.get("all").filter(player => player.faction != "Mafia");
                            const randomIndex = Math.floor(Math.random() * ambushedPlayersID.length);

                            for (const [index, ambushedPlayerID] of ambushedPlayersID.entries()){
                                if (index == randomIndex){
                                    if (targetMap.get(ambushedPlayerID).get("doctor")){
                                        publicAPIMap.get(visitingPlayerID).get("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("You ambushed someone who visited your target last night!"));

                                        publicAPIMap.get(ambushedPlayerID).get("messages", publicAPIMap.get(ambushedPlayerID).get("messages").push("You were attacked but someone nursed you back to health!"));
                                        publicAPIMap.get(ambushedPlayerID).set("statusCodes", publicAPIMap.get(ambushedPlayerID).get("statusCodes").push(4)); 

                                        let doctorID = targetMap.get(ambushedPlayerID).get("doctor")[0]; 

                                        publicAPIMap.get(targetMap.get(doctorID).get("doctor")[0]).set("messages", publicAPIMap.get(doctorID).get("messages").push("Your target was attacked last night!"));
                                        publicAPIMap.get(doctorID).set("statusCodes", publicAPIMap.get(doctorID).set("statusCodes").push(9)); 
                                    } else {
                                        publicAPIMap.get(visitingPlayerID).get("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("You ambushed someone who visited your target last night!"));
                                        publicAPIMap.get(ambushedPlayerID).get("messages", publicAPIMap.get(ambushedPlayerID).get("messages").push("You were attacked by a member of the Mafia! You have died!"));
                                        publicAPIMap.get(ambushedPlayerID).set("statusCodes", publicAPIMap.get(ambushedPlayerID).get("statusCodes").push(5));
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
                                publicAPIMap.get(spy.id).set("messages", publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`));
                            }
                            if (player.jailed){ 
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            } else {
                                publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push("Someone threatened to reveal your secrets. You are blackmailed!"));
                                publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).get("statusCodes").push(2));
                                player.blackmailed = true;
                            }
                        }  
                        break;
                    }
                    case "consigliere": {
                        for (const visitingPlayerID of playerIDs){
                            for (const spy of actionTracker.filter(player => player.role == "Spy")){
                                publicAPIMap.get(spy.id).set("messages", publicAPIMap.get(spy.id).get("messages").push(`A member of the Mafia visited ${player.tag} last night.`));
                            }
                            if (player.jailed){ 
                                publicAPIMap.get(visitingPlayerID).set("messages", publicAPIMap.get(visitingPlayerID).get("messages").push("Your ability failed because your target was in jail!"));
                            } else {
                                publicAPIMap.get(player.id).set("messages", publicAPIMap.get(player.id).get("messages").push("Someone threatened to reveal your secrets. You are blackmailed!"));
                                publicAPIMap.get(player.id).set("statusCodes", publicAPIMap.get(player.id).get("statusCodes").push(2));
                                player.blackmailed = true;
                            }
                        }  
                        break; 
                    }
                    case "consort":
                        break;
                    case "witch":
                        break;


                }
            }


            //WRT Messages: Visits that should trigger messages:
            /*
            - Consort
            - Escort
            - Witch

            Spy should very much be handled by backmessages (every player who gets visited by mafia will send a message to the spy)

            - Vigilante (also handle guilt, etc. as backlogic)
            - Mafioso/Godfather
            - If either of the above happen and a doctor/bodyguard saves you

            - Hypno message
            - Blackmail
            - Execution (if you're jailed)
            - TI (backmessage)
            - Visiting a Veteran (messages should be pushed onto the message array when the iterator is at the Veteran - we'll call this a backmessage)
            */
        }
        uniq(newDeaths);
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
        ["publicStatus", ``]
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
        ["statusCodes", []] //This is specifically for the spy. We can store a reference to the array

    ])));

    return publicAPIMap;
}