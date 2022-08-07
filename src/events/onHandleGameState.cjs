//A backend listener that handles all the necessary state changes. This exists in an inbetween phase, before gameDaytime and after gameNighttime

const { Collection } = require("discord.js");

const displayMessages = {
    transport: "You were transported to another location.",
    block: "Someone occupied your night. You were role blocked!",
    guard: "You were attacked but someone fought off your attacker!",
    heal: "You were attacked but someone nursed you back to health!",
    witch: "You feel a mystical power dominating you. You were controlled by a witch!",
    jail: "Your action failed because your target was in jail!",
    blackmail: "Someone threatened to reveal your secrets. You are blackmailed!",
    inaction: "You chose not to use your night time ability.",

    witch_fail: "You tried to control someone but they were immune!",
    target_witch_fail: "Someone tried to control you but you are immune!",
    block_fail: "You tried to role block someone but they were immune!",
    target_block_fail: "Someone tried to role block you but you are immune!",
    attack_fail: "You tried to attack someone but their Defense was too strong!",
    target_attack_fail: "Someone attacked you but your Defense was too strong!",

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

module.exports = function(client){
    client.on("handleGameState", async (guildID, channelID) => {
        //TODO: figure out who's dead, manage permissions at a user-based level
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);

        let targetMap = populateTargetMap(client, guildID, channelID);
        
        let actionTracker = gameCache.inGameRoles.filter(player => player.alive && player.priority && player.role != "Veteran").sort((a, b) => a.priority - b.priority);

        /*
        Get a list of what happens to every single player.

        First, we populate a map that maps player ids to all the information about players that have visited them.

        Then, we iterate through that map, storing info about which players visited who.

        Then, resolve messages and lasting state changes.

        Then, reset all the state.
        */

        //might be a good idea to handle all the non-inactive messages separately to avoid clutter.
        for (let player of actionTracker){
            switch (player.role){
                case "Retributionist":
                    if (player.targets.first && player.targets.second) {
                        const ressurectTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                        const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer == player.target.second);

                        targetMap.get(target.id).set(ressurectTarget.role.toLowerCase(), targetMap.get(target.id).get(ressurectTarget.role.toLowerCase()) ? targetMap.get(target.id).get(ressurectTarget.role.toLowerCase()).push(player.id) : [player.id]);
                    } else {
                        targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push(displayMessages.inaction)); 
                    }
                    break;
                case "Transporter":
                    if (player.targets.first && player.targets.second) {
                        const firstTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                        const secondTarget = gameCache.inGameRoles.find(targetPlayer => targetPlayer == player.target.second);

                        targetMap.get(firstTarget.id).set("transporter", targetMap.get(firstTarget.id).get("transporter") ? targetMap.get(firstTarget.id).get("transporter").push(player.id) : [player.id]);
                        targetMap.get(secondTarget.id).set("transporter", targetMap.get(secondTarget.id).get("transporter") ? targetMap.get(secondTarget.id).get("transporter").push(player.id) : [player.id]);
                    } else {
                        targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push(displayMessages.inaction)); 
                    } 
                    break;
                case "Witch":
                    if (player.targets.first) {
                        const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                        if (target.priority < player.priority){
                            targetMap.get(target.id).set("witch", [player.id]); 
                            targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push(displayMessages[`role_${target.role.toLowerCase()}`], displayMessages.witch_fail));
                            targetMap.get(target.id).set("messages", targetMap.get(target.id).get("messages").push(displayMessages.target_witch_fail));
                        } else {
                            targetMap.get(target.id).set("witch", [player.id]);
                            gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first).targets.first = player.targets.second; 
                            targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push(displayMessages[`role_${target.role.toLowerCase()}`]));
                            targetMap.get(target.id).set("messages", targetMap.get(target.id).get("messages").push(displayMessages.target_witch_fail)); 
                        }
                    } else {
                        targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push(displayMessages.inaction));
                    }
                    break;
                
                case "Escort": case "Consort":
                    if (player.targets.first) {
                        const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first);
                        if (target.priority <= player.priority){
                            targetMap.get(target.id).set(player.role.toLowerCase(), targetMap.get(target.id).get(player.role.toLowerCase()) ? targetMap.get(target.id).get(player.role.toLowerCase()).push(player.id) : [player.id]); 
                            if (player.faction == "Mafia") targetMap.get(target.id).set("mafia", targetMap.get(player.targets.first).get("mafia") ? targetMap.get(player.targets.first).get("mafia").push(player.id) : [player.id]);
                            targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push(displayMessages.block_fail));
                            targetMap.get(target.id).set("messages", targetMap.get(target.id).get("messages").push(displayMessages.target_block_fail));
                        } else {
                            targetMap.get(target.id).set(player.role.toLowerCase(), targetMap.get(player.targets.first).get(player.role.toLowerCase()) ? targetMap.get(player.targets.first).get(player.role.toLowerCase()).push(player.id) : [player.id]); 
                            if (player.faction == "Mafia") targetMap.get(target.id).set("mafia", targetMap.get(player.targets.first).get("mafia") ? targetMap.get(player.targets.first).get("mafia").push(player.id) : [player.id]);
                            gameCache.inGameRoles.find(targetPlayer => targetPlayer.id == player.targets.first).targets = {first: false, second: false, binary: false, options: false};
                            targetMap.get(target.id).set("messages", targetMap.get(target.id).get("messages").push(displayMessages.block)); 
                        }
                    } else {
                        targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push(displayMessages.inaction));
                    } 
                    break;
                
                default:
                    if (player.targets.first){
                        const target = gameCache.inGameRoles.find(targetPlayer => targetPlayer == player.target.second); 
                        targetMap.get(target.id).set(player.role.toLowerCase(), targetMap.get(target.id).get(player.role.toLowerCase()) ? targetMap.get(target.id).get(player.role.toLowerCase()).push(player.id) : [player.id]);
                        if (player.faction == "Mafia") targetMap.get(target.id).set("mafia", targetMap.get(player.targets.first).get("mafia") ? targetMap.get(player.targets.first).get("mafia").push(player.id) : [player.id]); 
                    } else {
                        targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push(displayMessages.inaction)); 
                    }
                    break;
            }
        }



    
    
        //Now, we have to resolve the messages that each player will have to see. Also, we will need to handle any lasting state effects (death, blackmailing)

        for (let player of gameCache.inGameRoles.filter(player => player.alive)){
            for (let [visitedByRole, playerIDs] of targetMap.get(player.id)){
                if (visitedByRole == "messages" || !playerIDs) continue;
                switch (visitedByRole){
                    case "executed":
                        break;
                    case "investigator":
                        break;
                    case "lookout":
                        break;
                    case "sheriff":
                        break;
                    case "spy":
                        break;
                    case "vigilante":
                        break;
                    case "bodyguard":
                        break;
                    case "doctor":
                        break;
                    case "escort":
                        break;
                    case "transporter":
                        break;
                    case "mafioso":
                        break;
                    case "godfather":
                        break;
                    case "disguiser":
                        break;
                    case "forger":
                        break;
                    case "framer":
                        break;
                    case "hypnotist":
                        break;
                   case "janitor":
                        break;
                    case "ambusher":
                        break;
                    case "blackmailer":
                        break;
                    case "consiglier":
                        break;
                    case "consort":
                        break;
                    case "witch":
                        break;
                    case "mafia":
                        break;
                        


                }
            }


            //WRT Messages: Visits that should trigger messages:
            /*
            - Consort
            - Escort
            - Witch

            - Vigilante
            - Mafioso/Godfather
            - If either of the above happen and a doctor/bodyguard saves you

            - Hypno message
            - Blackmail
            - Execution (if you're jailed)
            - TI (backmessage)
            - Visiting a Veteran (messages should be pushed onto the message array when the iterator is at the Veteran - we'll call this a backmessage)
            */
        }
    
    
    });
}


/*
Populates a map, mapping player IDs to the players that visited them the night before.

@param {Client} client
@param {guildID} guildID
@param {channelID} channelID
*/
function populateTargetMap(client, guildID, channelID){
    const gameCache = client.games.get(guildID).get(channelID);
    
    let targetMap = new Collection();
    gameCache.inGameRoles.filter(player => player.alive).forEach(player => targetMap.set(player.id, new Collection([
        //each role name gets mapped to an array of players of that role that visited the current player. Role is the player's role; messages refers to the messages that will be sent to this player
        ["messages", []],
        ["executed", false],
        ["investigator", false],
        ["lookout", false],
        ["sheriff", false],
        ["spy", false],
        ["vigilante", false],
        ["bodyguard", false],
        ["doctor", false],
        ["escort", false],
        ["transporter", false],
        ["mafioso", false],
        ["godfather", false],
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
        ["mafia", false]
    
    ])));

    return targetMap;
}