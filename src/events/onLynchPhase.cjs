const { MessageActionRow, MessageButton } = require("discord.js");
const { countMax } = require("../util/countMax.cjs");

module.exports = function(client){
    client.on("lynchPhase", async (remainingTime = 360, remainingLynches = 3, guildID, channelID ) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
        return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);

        let time = remainingTime;
        let lynches = remainingLynches;

        let lynchButtons = [];
        for (let player of gameCache.inGameRoles){
            if (!player.alive) continue;
            lynchButtons.push(new MessageButton()
                .setCustomId(player.id)
                .setLabel(client.users.cache.get(player.id).tag)
                .setStyle("PRIMARY"));
        }

        let votesRequired = Math.floor(lynchButtons.length / 2) + 1;

        const rows = [new MessageActionRow().addComponents(lynchButtons.slice(0, Math.min(5, lynchButtons.length)))];
        
        if (lynchButtons.length > 5) rows.push(new MessageActionRow()
            .addComponents(lynchButtons.slice(5, Math.min(10, lynchButtons.length))));
        
        if (lynchButtons.length > 10) rows.push(new MessageActionRow()
            .addComponents(lynchButtons.slice(10, lynchButtons.length)));

        const lynchMessage = await outputChannel.send({
            content: `It's time to send someone to trial! A total of ${votesRequired} are needed to do so.`,
            components: rows
        });

        let votes = gameCache.inGameRoles.find(player => player.alive && player.revealed) ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let playerIsLynched = false;
        
        //TODO: get rid of the time attribute on the collector. Manage the time separately using setinterval, and then call
        //collector.stop() as desired. Having two different intervals is imprecise because of event loop nature
        const collector = lynchMessage.createMessageComponentCollector({componentType: "BUTTON"});

        collector.on("collect", (interaction) => {
            let playerExists = gameCache.inGameRoles.find((player) => {
                return player.alive && (player.id == interaction.user.id);
            });
            if (!playerExists) return interaction.reply({content: "You can't click this button!", ephemeral: true});
            if (interaction.customId == interaction.user.id) return interaction.reply({content: "You can't vote for yourself!", ephemeral: true});

            let playerNumber = gameCache.inGameRoles.indexOf(playerExists);

            if (votes[playerNumber] == interaction.customId){
                if (playerExists.revealed){
                    votes[playerNumber] = votes[15] = votes[16] = 0;
                    interaction.reply(`${client.users.cache.get(playerExists.id).tag} cancelled their vote!`);
                } else {
                    votes[playerNumber] = 0;
                    interaction.reply(`${client.users.cache.get(playerExists.id).tag} cancelled their vote!`);
                }
            } else {
                if (playerExists.revealed){
                    votes [playerNumber] = votes[15] = votes[16] = interaction.customId;
                } else {
                    votes[playerNumber] = interaction.customId;
                }

                let numVotesNeeded = votesRequired;

                for (const vote of votes){
                    if (vote == interaction.customId) --numVotesNeeded;
                }

                const pluralVote = numVotesNeeded != 1 ? "votes" : "vote";

                interaction.reply(`${client.users.cache.get(playerExists.id).tag} voted for ${client.users.cache.get(interaction.customId).tag}. ${numVotesNeeded} ${pluralVote} are still needed to bring this player to trial!`);

                let maxVoted = countMax(votes);

                console.log(maxVoted.count);

                if (maxVoted.count >= votesRequired){
                    playerIsLynched = true;
                    collector.stop();
                    for (const row of rows){
                        for (let i = 0; i < 5; ++i){
                            row.components[i]?.setDisabled(true);
                        }
                    }
                    lynchMessage.edit({content: "You can't vote anymore!", components: rows});

                    clearInterval(interval);

                    client.emit("defensePhase", maxVoted.value, --lynches, time, guildID, channelID);
                }
            }
        });


        collector.on("end", () => {
            if (!playerIsLynched) outputChannel.send("It is now too late to continue voting.");
        });

        const interval = setInterval(() => {
            --time;
            if (!time){
                handleSetInterval(rows, lynchMessage, client, collector, guildID, channelID);
                clearInterval(interval);
            }
        }, 1000);

    });      
}


async function handleSetInterval(rows, lynchMessage, client, collector, guildID, channelID){
    collector.stop();
    for (const row of rows){
        for (let i = 0; i < 5; ++i){
            row.components[i]?.setDisabled(true);
        }
    }
    await lynchMessage.edit({content: "You can't vote anymore!", components: rows});
    client.emit("gameNighttime", guildID, channelID);
}