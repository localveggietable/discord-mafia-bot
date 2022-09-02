const { MessageButton, MessageActionRow } = require("discord.js");
const GamePlayer = require("./GamePlayer.cjs");

var actionRoleObject = {
    Janitor: "Choose who you want to clean:",
    Ambusher: "Choose who you want to ambush:",
    Framer: "Choose who you want to frame:",
    Blackmailer: "Choose who you want to blackmail:",
    Consigliere: "Choose who you want to investigate:",
    Consort: "Choose who you want to role block:"
};

class MafiaGamePlayer extends GamePlayer{ 
    constructor(role, id, tag){
        super(role, id, tag);
        //For disguiser.
        this.faction = "Mafia";
        if (this.role == "Ambusher"){
            this.priority = 1;
        } else if (this.role == "Consort"){
            this.priority = 2;
        } else if (["Blackmailer", "Disguiser", "Consigliere", "Forger", "Framer", "Hypnotist", "Janitor", "Godfather", "Mafioso"].indexOf(this.role)){
            this.priority = 3;
        } else {
            this.priority = 0;
        }
    }

    //Returns an array of messages (to send, one at a time, into the mafia channel at the beginning of gameNighttime)

    /*

    @param {Array<GamePlayer>} players

    */
    static resolveNighttimeOptions(players){
        let aliveMafiaMembers = players.filter(player => player.faction == "Mafia" && player.alive);
        let aliveTownMembers = players.filter(player => player.faction != "Mafia" && player.alive);
        let mafiosoAndGodfatherRoles = aliveMafiaMembers.filter(player => ["Mafioso", "Godfather"].includes(player.role) && player.alive);
        let outputMessages = [];
        for (const mafiaMember of aliveMafiaMembers){
            if (["Godfather", "Mafioso"].indexOf(mafiaMember.role) != -1) continue;
            if (mafiaMember.role == "Disguiser"){
                let townButtons = [], mafiaButtons = [];
                for (const player of aliveMafiaMembers){
                    mafiaButtons.push(new MessageButton()
                        .setCustomId(player.id)
                        .setLabel(player.tag)
                        .setStyle("PRIMARY"));
                }
                for (const player of aliveTownMembers){
                    townButtons.push(new MessageButton()
                        .setCustomId(player.id)
                        .setLabel(player.tag)
                        .setStyle("PRIMARY"));  
                }

                const rows = [new MessageActionRow().addComponents(mafiaButtons), 
                            new MessageActionRow().addComponents(townButtons.slice(0, Math.min(5, townButtons.length)))];

                if (townButtons.length > 5) rows.push(new MessageActionRow()
                .addComponents(townButtons.slice(5, Math.min(10, townButtons.length))));
        
                if (townButtons.length > 10) rows.push(new MessageActionRow()
                .addComponents(townButtons.slice(10, townButtons.length)));

                rows.push(new MessageActionRow()
                    .addComponents(new MessageButton()
                        .setCustomId("clear")
                        .setLabel("Clear Selection")
                        .setStyle("SECONDARY")));
                
                outputMessages.push([mafiaMember, {content: `${mafiaMember.tag}, choose who you want to disguise and what town member they should be disguised as:`, components: rows}]);

            } else if (mafiaMember.role == "Forger"){
                if (!mafiaMember.limitedUses.uses) return {content: ""};
                let townButtons = [];
                for (const player of aliveTownMembers){
                    townButtons.push(new MessageButton()
                        .setCustomId(player.id)
                        .setLabel(player.tag)
                        .setStyle("PRIMARY"));  
                }

                townButtons.push(new MessageButton()
                    .setCustomId("clear")
                    .setLabel("Clear Selection")
                    .setStyle("SECONDARY"));
                
                const rows = [new MessageActionRow().addComponents(townButtons.slice(0, Math.min(5, townButtons.length)))];

                if (townButtons.length > 5) rows.push(new MessageActionRow()
                .addComponents(townButtons.slice(5, Math.min(10, townButtons.length))));

                if (townButtons.length > 10) rows.push(new MessageActionRow()
                .addComponents(townButtons.slice(10, townButtons.length)));

                outputMessages.push([mafiaMember, {content: `${mafiaMember.tag}, choose whose will you want to forge. To specify the message, use the command /forge "<message you want to replace the will with, delimited using double quotes>:"`,
                        components: rows}]);
                
            } else if (mafiaMember.role == "Hypnotist"){
                let playerButtons = [];
                for (const player of players){
                    if (!player.alive || player.id == mafiaMember.id) continue;
                    playerButtons.push(new MessageButton()
                        .setCustomId(player.id)
                        .setLabel(player.tag)
                        .setStyle("PRIMARY"));
                }

                const rows = [new MessageActionRow().addComponents(playerButtons.slice(0, Math.min(5, playerButtons.length)))];

                if (playerButtons.length > 5) rows.push(new MessageActionRow()
                    .addComponents(playerButtons.slice(5, Math.min(10, playerButtons.length))));
        
                if (playerButtons.length > 10) rows.push(new MessageActionRow()
                    .addComponents(playerButtons.slice(10, playerButtons.length)));

                rows.push(new MessageActionRow()
                    .addComponents([
                        new MessageButton()
                            .setCustomId("transport")
                            .setLabel("Transported")
                            .setStyle("SUCCESS"),

                            new MessageButton()
                            .setCustomId("block")
                            .setLabel("Role Blocked")
                            .setStyle("SUCCESS"),

                            new MessageButton()
                            .setCustomId("guard")
                            .setLabel("Defender Fought Off Attacker")
                            .setStyle("SUCCESS"),

                            new MessageButton()
                            .setCustomId("heal")
                            .setLabel("Healed")
                            .setStyle("SUCCESS"),

                            new MessageButton()
                            .setCustomId("witch")
                            .setLabel("Witched")
                            .setStyle("SUCCESS")
                    ]));
                
                rows.push(new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId("clear")
                            .setLabel("Clear Selection")
                            .setStyle("SECONDARY")
                    ));

                outputMessages.push([mafiaMember, {content: `${mafiaMember.tag}, choose a player to hypnotize, and what message you want to send them:`, components: rows}]);
            } else {
                if (!mafiaMember.limitedUses.uses) return {content: ""};
                let playerButtons = [];
                for (const player of players){
                    if (!player.alive || player.id == mafiaMember.id) continue;
                    playerButtons.push(new MessageButton()
                        .setCustomId(player.id)
                        .setLabel(player.tag)
                        .setStyle("PRIMARY"));
                }

                playerButtons.push(new MessageButton()
                    .setCustomId("clear")
                    .setLabel("Clear Selection")
                    .setStyle("SECONDARY"));
                
                const rows = [new MessageActionRow().addComponents(playerButtons.slice(0, Math.min(5, playerButtons.length)))];

                if (playerButtons.length > 5) rows.push(new MessageActionRow()
                    .addComponents(playerButtons.slice(5, Math.min(10, playerButtons.length))));
            
                if (playerButtons.length > 10) rows.push(new MessageActionRow()
                    .addComponents(playerButtons.slice(10, playerButtons.length)));

                outputMessages.push([mafiaMember, {content: `${mafiaMember.tag}, ${actionRoleObject[mafiaMember.role]}`, components: rows}]);
            }

        }

        let townButtons = [];
        for (const player of aliveTownMembers){
            townButtons.push(new MessageButton()
                .setCustomId(player.id)
                .setLabel(player.tag)
                .setStyle("PRIMARY"));
        }

        townButtons.push(new MessageButton()
                .setCustomId("clear")
                .setLabel("Clear Selection")
                .setStyle("SECONDARY"));
                
        const rows = [new MessageActionRow().addComponents(townButtons.slice(0, Math.min(5, townButtons.length)))];

        if (townButtons.length > 5) rows.push(new MessageActionRow()
            .addComponents(townButtons.slice(5, Math.min(10, townButtons.length))));
            
        if (townButtons.length > 10) rows.push(new MessageActionRow()
            .addComponents(townButtons.slice(10, townButtons.length)));

        console.log(rows.length);

        outputMessages.push([mafiosoAndGodfatherRoles, {content: "Godfather and/or Mafioso, choose who you want to kill:", components: rows}]);

        return outputMessages;
    }

    async handleDeath(client, guildID, channelID){
        const gameCache = client.games.get(guildID).get(channelID);
        const mafiaChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID && channel.name.split("-")[0] == "mafia";
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "mafia-tos-channel"});

        let toReturn = await super.handleDeath(client, guildID, channelID);

        if (this.role == "Godfather"){
            const aliveMafiaPlayer = gameCache.inGameRoles.find(player => player.alive && player.role == "Mafioso");
            if (aliveMafiaPlayer) {
                aliveMafiaPlayer.role = "Godfather";
                await mafiaChannel.send(`${aliveMafiaPlayer.tag} has now been promoted to Godfather!`);
            } else {
                const aliveSupportMafiaPlayer = gameCache.inGameRoles.find(player => player.alive && player.faction == "Mafia");
                if (!aliveSupportMafiaPlayer) return toReturn;
                aliveSupportMafiaPlayer.role = "Mafioso";
                await mafiaChannel.send(`${aliveSupportMafiaPlayer.tag} has now become a Mafioso!`);
            }
        } else if (this.role == "Mafioso"){
            const aliveGodfatherPlayer = gameCache.inGameRoles.find(player => player.alive && player.role == "Godfather");
            if (aliveGodfatherPlayer) return toReturn;
            const aliveSupportMafiaPlayer = gameCache.inGameRoles.find(player => player.alive && player.faction == "Mafia");
            if (!aliveSupportMafiaPlayer)  return toReturn;
            aliveSupportMafiaPlayer.role = "Mafioso";
            await mafiaChannel.send(`${aliveSupportMafiaPlayer.tag} has now become a Mafioso!`); 
        }

        return toReturn;
    }

}

module.exports = MafiaGamePlayer;