const { MessageButton, MessageActionRow } = require("discord.js");
const GamePlayer = require("./GamePlayer.cjs");

var actionRoleObject = {
    Investigator: "Choose who you want to investigate",
    Lookout: "Choose who you want to watch",
    Sheriff: "Choose who you want to check",
    Spy: "Choose who you want to spy on",
    Jailor: "Choose whether or not to ",
    Veteran: "To go on alert, use the slash command /veteran",
    Vigilante: "You spend the night polishing your gun so you cannot shoot anyone. To shoot someone (starting next night), use the slash command /vigilante <player tag>",
    Bodyguard: "To protect someone, use the slash command /bodyguard <player tag>",
    Doctor: "To heal someone, use the slash command /doctor <player tag>",
    Escort: "To distract someone, use the slash command /escort <player tag>",
    Retributionist: "To use a dead town member's abilities, use the slash command /retributionist <player tag>",
    Transporter: "To transport two people, use the slash command /transporter <player tag 1> <player tag 2>",
    Disguiser: "To disguise a mafia member, use the slash command /disguiser <player tag>",
    Forger: "To forge someone's will, use the slash command /forger <player tag> <string delimited by double quotes (\" \")>",
    Hypnotist: "To hypnotize someone, use the slash command /hypnotist ",
    Janitor: "To clean someone, use the slash command /",
    Ambush: "To ambush someone, use the slash command / ",
    Godfather: "To kill someone, use the slash command /",
    Mafioso: "To vote to kill someone, use the slash command /",
    Blackmailer: "To blackmail someone, use the slash command /",
    Consigliere: "To investigate someone, use the slash command /",
    Consort: "To disctract someone, user the slash command /"
};

class TownGamePlayer extends GamePlayer{
    constructor(role, id, tag){
        super(role, id, tag);
        this.faction = "Town";
    }

    //Returns a reference to the message to be sent to a player at the start of the gameNighttime event.
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
    }

    resolveJailorNighttimeOptions(){

    }

}

module.exports = TownGamePlayer;