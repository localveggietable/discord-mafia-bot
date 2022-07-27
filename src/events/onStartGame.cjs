import shuffleArray from "../util/shuffleArray.js";

const {WitchGamePlayer} = require("../gameclasses/WitchGamePlayer.cjs");
const {ExeGamePlayer} = require("../gameclasses/ExeGamePlayer.cjs");
const {MafiaGamePlayer} = require("../gameclasses/MafiaGamePlayer.cjs");
const {TownGamePlayer} = require("../gameclasses/TownGamePlayer.cjs");

module.exports = async function(client){
    client.on("startGame", async function(guildID, channelID){
        client.games.get(guildID).get(channelID).started = true;
        let time = 15;
        const outputChannel = channelID ? client.channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.channels.cache.find((channel) => {return channel.name == "tos-channel"});

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

        let shufflePlayers = shuffleArray([...client.games.get(guildID).get(channelID).players]);

        let players = {
            [Symbol.iterator]: function(){
                var self = this;
                var state = 0;
                return {
                    next(){
                        if (state == 15) return {done: true};
                        ++state;
                        return {value: self[state], done: false}
                    }
                }
            },
            1: new TownGamePlayer("Jailor", shufflePlayers[0]),
            2: new TownGamePlayer(tiRole1, shufflePlayers[1]),
            3: new TownGamePlayer(tiRole2, shufflePlayers[2]),
            4: new TownGamePlayer(tpRole, shufflePlayers[3]),
            5: new TownGamePlayer(tkRole, shufflePlayers[4]),
            6: new TownGamePlayer(tsRole, shufflePlayers[5]),
            7: new TownGamePlayer(rtRole1, shufflePlayers[6]),
            8: new TownGamePlayer(rtRole2, shufflePlayers[7]),
            9: new TownGamePlayer(rtRole3, shufflePlayers[8]),
            10: new MafiaGamePlayer("Godfather", shufflePlayers[9]),
            11: new MafiaGamePlayer("Mafioso", shufflePlayers[10]),
            12: new MafiaGamePlayer(rmRole1, shufflePlayers[11]),
            13: new MafiaGamePlayer(rmRole2, shufflePlayers[12]),
            14: new ExeGamePlayer(shufflePlayers[13]),
            15: new WitchGamePlayer(shufflePlayers[14])
        }

        client.games.get(guildID).get(channelID).inGameRoles = players;

        let interval = setInterval(() => {
            outputChannel.send(time--);
            if (!time){
                client.emit("gameDaytime", true); //The parameter determines whether or not it is the first night.
                clearInterval(interval);
            }
        }, 1000);
    });
}