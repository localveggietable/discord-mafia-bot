const { MessageButton, MessageActionRow } = require("discord.js");
const GamePlayer = require("./GamePlayer.cjs");

var actionRoleObject = {
    Janitor: "Choose who you want to clean:",
    Ambush: "Choose who you want to ambush:",
    Blackmailer: "Choose who you want to blackmail:",
    Consigliere: "Choose who you want to investigate:",
    Consort: "Choose who you want to role block:"
};

class MafiaGamePlayer extends GamePlayer{ 
    constructor(role, id, tag){
        super(role, id, tag);
        //For disguiser.
        this.faction = "Mafia"
    }

    //Returns an array of messages (to send, one at a time, into the mafia channel at the beginning of gameNighttime)

    /*

    @param {Array<GamePlayer>} players
    @param {boolean} firstNight

    */
    static resolveNighttimeOptions(players){
        let aliveMafiaMembers = players.filter(player => player.role == "Mafia" && player.alive);
        let aliveTownMembers = players.filter(player => player.role != "Mafia" && player.alive);
        let outputMessages = [];
        for (const mafiaMember of aliveMafiaMembers){
            if (["Godfather", "Mafioso"].indexOf(mafiaMember.role) != -1) continue;
            if (mafiaMember.role == "Disguiser"){
                let townButtons = [], mafiaButtons = [];
                for (const player of aliveMafiaMembers){
                    mafiaButtons.push(new MessageButton()
                        .setCustomId(player.id + "")
                        .setLabel(player.tag)
                        .setStyle("PRIMARY"));
                }
                for (const player of aliveTownMembers){
                    townButtons.push(new MessageButton()
                        .setCustomId(player.id + "")
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
                
                outputMessages.push({content: `${mafiaMember.tag}, choose who you want to disguise and what town member they should be disguised as:`, components: rows});

            } else if (mafiaMember.role == "Forger"){
                let townButtons = [];
                for (const player of aliveTownMembers){
                    townButtons.push(new MessageButton()
                        .setCustomId(player.id + "")
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

                return {content: `${mafiaMember.tag}, choose whose will you want to forge. To specify the message, use the command /forge "<message you want to replace the will with, delimited using double quotes>:"`,
                        components: rows};
                
            } else if (mafiaMember.role == "Hypnotist"){
                let playerButtons = [];
                for (const player of players){
                    if (!player.alive || player.id == mafiaMember.id) continue;
                    playerButtons.push(new MessageButton()
                        .setCustomId(player.id + "")
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

                outputMessages.push({content: `${mafiaMember.tag}, choose a player to hypnotize, and what message you want to send them:`, components: rows});
            } else {
                let playerButtons = [];
                for (const player of players){
                    if (!player.alive || player.id == mafiaMember.id) continue;
                    playerButtons.push(new MessageButton()
                        .setCustomId(player.id + "")
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

                outputMessages.push({content: `${mafiaMember.tag}, ${actionRoleObject[mafiaMember.role]}`, components: rows});
            }

        }

        let townButtons = [];
        for (const player of aliveTownMembers){
            townButtons.push(new MessageButton()
                .setCustomId(player.id + "")
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

        outputMessages.push({content: "Godfather and/or Mafioso, choose who you want to kill:", components: rows});

        return outputMessages;
    }

}

module.exports = MafiaGamePlayer;