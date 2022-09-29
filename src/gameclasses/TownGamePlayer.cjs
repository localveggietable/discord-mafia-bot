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
        default: "Choose who you want to shoot:"
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
       // this.retributionistCanUse = ["Jailor", "Veteran", "Mayor", "Medium", "Veteran"].indexOf(this.role) == -1 ? false : true;
       //do the above in handle death
        if (["Retributionist", "Transporter", "Veteran"].includes(this.role)){
            this.priority = 1;
        } else if (this.role == "Escort"){
            this.priority = 2;
        } else if (["Bodyguard", "Doctor", "Investigator", "Lookout", "Sheriff", "Jailor", "Vigilante", "Spy", "Medium"].includes(this.role)){
            this.priority = 3;
        } else if (this.role == "Transporter"){
            this.priority = 4;
        } else {
            this.priority = 0;
        }
        //Whether or not the mayor has revealed themselves.
        this.revealed = this.role == "Mayor" ? false : undefined;
    }

    //Returns a reference to the message to be sent to a player at the start of the gameNighttime event.
    /*

    @param {Array<GamePlayer>} players
    @param {boolean} firstNight

    */
    resolveNighttimeOptions(players, firstNight){
        if (this.role == "Retributionist") return this.resolveRetributionistNighttimeOptions(players);
        if (!actionRoleObject[this.role] || (this.role == "Jailor" && !this.targets.first)) return;
        if ((actionRoleObject[this.role].firstNight && firstNight) || (["Jailor", "Veteran", "Vigilante"].includes(this.role) && this.limitedUses.uses <= 0)) return this.resolveEmptyNighttimeOptions(firstNight);
        if (["Jailor", "Veteran"].includes(this.role)) return this.resolveBinaryNighttimeOptions();
        return this.resolveDefaultNighttimeOptions(players);
    }

    resolveDefaultNighttimeOptions(players){
        let playerButtons = [];
        for (const player of players){
            if (!player.alive) continue;
            if (this.role == "Doctor" && player.revealed) continue;
            if (!(["Bodyguard", "Doctor"].includes(this.role) && this.limitedUses.uses) && player.id == this.id) continue;
            else if (player.id == this.id){
                const roleMsg = this.role == "Doctor" ? "Heal" : "Protect";
                playerButtons.unshift(new MessageButton()
                    .setCustomId(player.id)
                    .setLabel(`Self ${roleMsg} (1 left)`)
                    .setStyle("SUCCESS")); 
                continue;
            }
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
            .addComponents(playerButtons.slice(10, Math.min(15, playerButtons.length))));

        if (playerButtons.length > 15) rows.push(new MessageActionRow()
            .addComponents(playerButtons.slice(15, playerButtons.length)));

        let returnContent = actionRoleObject[this.role].default ?  actionRoleObject[this.role].default : actionRoleObject[this.role];
        if (this.role == "Vigilante") returnContent = returnContent.concat(` (You have ${this.limitedUses.uses} bullets left.)`);
        return {content: returnContent, components: rows};
    }

    resolveEmptyNighttimeOptions(firstNight){
        if (firstNight) return {content: actionRoleObject[this.role].firstNight}; 
        if (!this.limitedUses.uses) return;
        switch (this.role){
            case "Vigilante":
                return {content: "You put your gun down from the guilt of shooting a town member."}; 
            case "Jailor":
                return {content: "You cannot execute your target because you killed a town member."};
        }
    }

    resolveBinaryNighttimeOptions(){
        const row = [new MessageActionRow()
            .addComponents(
                //should be stored in the binary property of targets 
                new MessageButton()
                .setCustomId(1 + "")
                .setLabel("Do it")
                .setStyle("PRIMARY"),

                new MessageButton()
                .setCustomId( 0 + "")
                .setLabel("Don't")
                .setStyle("PRIMARY")
            )];

        const message = this.role == "Jailor" ? `${actionRoleObject[this.role].default} (You have ${this.limitedUses.uses} executions left.)` : `${actionRoleObject[this.role]} (You have ${this.limitedUses.uses} alerts left.)`;
        
        return {content: message, components: row};
    }

    resolveRetributionistNighttimeOptions(players){
        let playerButtons = [];
        let targetButtons = [];
        for (const player of players){
            if (!player.retributionistCanUse) continue;
            playerButtons.push(new MessageButton()
            .setCustomId(player.id)
            .setLabel(`${player.tag} (${player.role})`)
            .setStyle("PRIMARY")); 
        }

        if (!playerButtons.length) return;

        for (const target of players.filter(target => target.alive)){
            if (target.id == this.id) continue;
            targetButtons.push(new MessageButton()
                .setCustomId(`target${target.id}`))
                .setLabel(`${target.tag}`)
                .setStyle("PRIMARY");
        }

        targetButtons.push(new MessageButton()
        .setCustomId("clear")
        .setLabel("Clear Selection")
        .setStyle("SECONDARY"));

        const rows = [new MessageActionRow().addComponents(playerButtons.slice(0, Math.min(5, playerButtons.length)))];
        
        if (playerButtons.length > 5) rows.push(new MessageActionRow()
            .addComponents(playerButtons.slice(5, Math.min(10, playerButtons.length))));
        
        rows.push(new MessageActionRow()
            .addComponents(targetButtons.slice(0, Math.min(5, targetButtons.length))));

        if (targetButtons.length > 5) rows.push(new MessageActionRow()
            .addComponents(targetButtons.slice(5, Math.min(10, targetButtons.length))));

        if (targetButtons.length > 10) rows.push(new MessageActionRow()
            .addComponents(targetButtons.slice(10, targetButtons.length)));

        return {content: "Choose which dead town member you want to ressurect:", components: rows};
    }
}

module.exports = TownGamePlayer;