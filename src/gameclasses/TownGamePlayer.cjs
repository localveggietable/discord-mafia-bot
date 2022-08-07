const { MessageButton, MessageActionRow } = require("discord.js");
const GamePlayer = require("./GamePlayer.cjs");

var actionRoleObject = {
    Investigator: "Choose who you want to investigate:",
    Lookout: "Choose who you want to watch:",
    Sheriff: "Choose who you want to check:",
    Spy: "Choose who you want to spy on:",
    Jailor: {
        firstNight: "It is the first night so you cannot execute your target.",
        default: "Choose whether or not to execute:"
    },
    Veteran: "Choose whether or not to go on alert:",
    Vigilante: {
        firstNight: "You spend the night polishing your gun so you cannot shoot anyone.",
        default: "Choose who you want to shoot"
    },
    Bodyguard: "Choose who you want to protect:",
    Doctor: "Choose who you want to heal:",
    Escort: "Choose who you want to distract:",
    Transporter: "Choose which two people you want to transport:",
};

class TownGamePlayer extends GamePlayer{
    constructor(role, id, tag){
        super(role, id, tag);
        this.faction = "Town";
        this.retributionistCanUse = false;
       // this.retributionistCanUse = ["Jailor", "Veteran", "Mayor", "Medium", "Veteran"].indexOf(this.role) == -1 ? false : true;
       //do the above in handle death
        if (["Retributionist", "Transport", "Veteran"].indexOf(this.role) != -1){
            this.priority = 1;
        } else if (this.role == "Escort"){
            this.priority = 2;
        } else if (["Bodyguard", "Doctor"].indexOf(this.role) != -1){
            this.priority = 3;
        } else if (["Investigator", "Lookout", "Sheriff"].indexOf(this.role) != -1){
            this.priority = 4;
        } else if (["Jailor", "Vigilante"].indexOf(this.role) != -1){
            this.priority = 5;
        } else if (this.role == "Spy"){
            this.prority == 6;
        } else {
            this.priority = 0;
        }
    }

    //Returns a reference to the message to be sent to a player at the start of the gameNighttime event.
    /*

    @param {Array<GamePlayer>} players
    @param {boolean} firstNight

    */
    resolveNighttimeOptions(players, firstNight){
        if (!actionRoleObject[this.role]) return;
        if (actionRoleObject[this.role].firstNight && firstNight) return this.resolveBinaryNighttimeOptions();
        if (this.role == "Retributionist") return this.resolveRetributionistNighttimeOptions(players);
        return this.resolveDefaultNighttimeOptions(players);
    }

    resolveDefaultNighttimeOptions(players){
        let playerButtons = [];
        for (const player of players){
            if (!player.alive || player.id == this.id) continue;
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

        return {content: actionRoleObject[this.role], components: rows};
    }

    resolveBinaryNighttimeOptions(){
        const row = [new MessageActionRow()
            .addComponents(
                new MessageButton()
                .setCustomId(1 + "")
                .setLabel("Do it")
                .setStyle("PRIMARY"),

                new MessageButton()
                .setCustomId(2 + "")
                .setLabel("Don't")
                .setStyle("PRIMARY")
            )];

        const message = this.role == "Jailor" ? actionRoleObject[this.role].default : actionRoleObject[this.role];
        
        return {content: message, components: row};
    }

    resolveRetributionistNighttimeOptions(players){
        let playerButtons = [];
        for (const player of players){
            if (player.retributionistCanUse === false) continue;
            playerButtons.push(new MessageButton()
            .setCustomId(player.id + "")
            .setLabel(`${player.tag} (${player.role})`)
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

        return {content: "Choose which dead town member you want to ressurect:", components: rows};
    }
}

module.exports = TownGamePlayer;