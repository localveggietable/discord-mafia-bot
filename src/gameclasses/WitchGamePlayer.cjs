const { MessageButton, MessageActionRow } = require("discord.js");
const GamePlayer = require("./GamePlayer.cjs");

class WitchGamePlayer extends GamePlayer{
    constructor(id, tag, displayName){
        super("Witch", id, tag, displayName);
        this.priority = 2;
        this.faction = "Witch";
    }

    resolveNighttimeOptions(players){
        let playerButtons = [];
        for (const player of players){
            if (player.id == this.id) continue;
            playerButtons.push(new MessageButton()
                .setCustomId(player.id + "")
                .setLabel(`${player.tag}`)
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

        return {content: "Choose a player to control, then choose their target:", components: rows};
    }
}

module.exports = WitchGamePlayer;