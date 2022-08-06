//A backend listener that handles all the necessary state changes. This exists in an inbetween phase, before gameDaytime and after gameNighttime

const { Collection } = require("discord.js");

module.exports = function(client){
    client.on("handleGameState", async (guildID, channelID) => {
        //TODO: figure out who's dead, manage permissions at a user-based level
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);

        let targetMap = populateTargetMap(client, guildID, channelID);
        let actionTracker = gameCache.inGameRoles.filter(player => player.alive).sort((a, b) => a.priority - b.priority);

        for (let i = 1; i < 7; ++i){
            for (let player of actionTracker){
                if (player.priority != i) continue;
                
            }
        }

        for (let player of actionTracker){
            if (["Consort", "Escort"].indexOf(player.role) == -1) continue;
            if (player.targets.first) {
                targetMap.get(player.targets.first).set(player.role.toLowerCase(), targetMap.get(player.targets.first).get(player.role.toLowerCase) ? targetMap.get(player.targets.first).get(player.role.toLowerCase).push(player.id) : [player.id]);
                gameCache.inGameRoles.find(player => player.id == player.targets.first).targets = {first: false, second: false, binary: false, options: false};
            } else {
                targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push("You chose not to use your night time ability."));
            }
        }

        actionTracker = actionTracker.filter(player => ["Consort", "Escort", "Witch"].indexOf(player.role) == -1);

        for (let player of actionTracker){

            //general case

            if (player.targets.first) {
                targetMap.get(player.targets.first).set(player.role.toLowerCase(), targetMap.get(player.targets.first).get(player.role.toLowerCase) ? targetMap.get(player.targets.first).get(player.role.toLowerCase).push(player.id) : [player.id]);
            } else if (targetMap.get(player.id).get("escort") || targetMap.get(player.id).get("consort")){
                targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push("Your night was occupied! You were role blocked."));
            } else {
                targetMap.get(player.id).set("messages", targetMap.get(player.id).get("messages").push("You chose not to use your night time ability.")); 
            }
        }

        /*
        Get a list of what happens to every single player.

        First, we populate a map that maps player ids to all the information about players that have visited them.

        Then, we iterate through that map, sending each player that visited 
        */
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
    gameCache.inGameRoles.forEach(player => targetMap.set(player.id, new Collection([
        //each role name indicates which players of that role visited the current player. Role is the player's role; messages refers to the messages that 
        ["role", player.role],
        ["messages", []],
        ["jailed", false], //update this.
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
        ["witch", false]
    
    ])));

    return targetMap;
}