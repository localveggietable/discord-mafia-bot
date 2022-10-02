import { MessageActionRow, MessageButton } from "discord.js";

const GamePlayer = require("./GamePlayer.cjs");

class ExeGamePlayer extends GamePlayer{
    constructor(id, tag, displayName, targetID){
        super("Executioner", id, tag, displayName);
        this.won = false;
        this.jester = false;
        this.priority = 0;
        this.faction = "Executioner";
        this.targetID = targetID;
        this.canRevenge = false;
    }

    resolveNighttimeOptions(players){
        if (!this.canRevenge) return;
        let playerButtons = [];
        for (let player of players){
            if (!player.alive || !player.validRevengeTarget) continue;
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

        return {content: "Choose which player you want to take revenge on:", components: rows};
    }
}

module.exports = ExeGamePlayer;