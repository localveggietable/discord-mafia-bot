const { ComponentType, MessageActionRow, MessageButton } = require("discord.js");
const { countAlivePlayers } = require("../util/countAlivePlayers.cjs");
const { countMax } = require("../util/countMax.cjs");

module.exports = function(client){
    client.on("lynchPhase", async (remainingTime = 45, remainingLynches = 3, guildID, channelID ) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
        return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);

        let alivePlayers = countAlivePlayers(client, guildID, channelID);
        let votesRequired = Math.floor(alivePlayers.count / 2) + 1;
        let time = remainingTime;
        let lynches = remainingLynches;

        let lynchButtons = [];
        for (let player of gameCache.inGameRoles){
            if (!player.alive) continue;
            lynchButtons.push(new MessageButton()
                .setCustomId(player.id + "")
                .setLabel(client.users.cache.get(player.id).tag)
                .setStyle("PRIMARY"));
        }

        const rows = [new MessageActionRow().addComponents(lynchButtons.slice(0, Math.min(5, alivePlayers)))];
        
        if (lynchButtons.length > 5) rows.push(new MessageActionRow()
            .addComponents(lynchButtons.slice(5, Math.min(10, alivePlayers))));
        
        if (lynchButtons.length > 10) rows.push(new MessageActionRow()
            .addComponents(lynchButtons.slice(10, alivePlayers)));

        const lynchMessage = await outputChannel.send({
            content: `It's time to send someone to trial! A total of ${votesRequired} are needed to do so.`,
            components: rows
        });

        let votes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], playerIsLynched = false;
        
        //TODO: get rid of the time attribute on the collector. Manage the time separately using setinterval, and then call
        //collector.stop() as desired. Having two different intervals is imprecise because of event loop nature
        const collector = lynchMessage.createMessageComponentCollector({componentType: ComponentType.Button, time: 30000});

        collector.on("collect", async (interaction) => {
            let playerExists = gameCache.inGameRoles.find((player) => {
                return player.alive && (player.id == interaction.user.id);
            });
            if (!playerExists) return interaction.reply({content: "You can't click this button!", ephemeral: true});

            let playerNumber = gameCache.inGameRoles.indexOf(playerExists);
            votes[playerNumber] = +interaction.customId;

            outputChannel.send(`${client.users.cache.get(playerExists.id).tag} voted for ${client.users.cache.get(interaction.customId).tag}`);

            let maxVoted = countMax(votes);

            if (maxVoted.cardinality >= votesRequired){
                collector.stop();
                playerIsLynched = true;
                client.emit("defensePhase", maxVoted.value, --lynches, time, guildID, channelID);
                for (const row in rows){
                    for (let i = 0; i < 5; ++i){
                        row?.components[i].setDisabled(true);
                    }
                }
                await lynchMessage.edit({content: "You can't vote anymore!", components: rows});
            }
        });


        collector.on("end", () => {
            if (!playerIsLynched) outputChannel.send("It is now too late to continue voting");
        });

        const interval = setInterval(async () => {
            if (!(time--)){
                collector.stop();
                client.emit("gameNighttime", guildID, channelID);
                for (const row in rows){
                    for (let i = 0; i < 5; ++i){
                        row?.components[i].setDisabled(true);
                    }
                }
                await lynchMessage.edit({content: "You can't vote anymore!", components: rows}); 
                clearInterval(interval);
            }
        }, 1000);

    });      
}