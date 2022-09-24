const { MessageActionRow, MessageButton } = require("discord.js");
const { countMax } = require("../util/countMax.cjs");


module.exports = function(client){
    client.on("votingPhase", async (playerID, lynchesLeft, timeLeft, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
            }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);

        const row = [new MessageActionRow()
            .addComponents([

                new MessageButton()
                .setCustomId(1 + "")
                .setLabel("Not Guilty")
                .setStyle("PRIMARY"),

                new MessageButton()
                .setCustomId(2 + "")
                .setLabel("Guilty")
                .setStyle("PRIMARY")

            ])];

        const voteMessage = await outputChannel.send({
            content: "Vote!",
            components: row
        });

        let votes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], playerKilled;
        const collector = voteMessage.createMessageComponentCollector({componentType: "BUTTON"});


        collector.on("collect", async (interaction) => {
            let playerExists = gameCache.inGameRoles.find((player) => {
                return player.alive && (player.id == interaction.user.id);
            });
            if (!playerExists || playerExists.id == playerID) return interaction.reply({content: "You can't click this button!", ephemeral: true});

            let playerNumber = gameCache.inGameRoles.indexOf(playerExists);
            let temp = votes[playerNumber];
            votes[playerNumber] = +interaction.customId;

            if (!temp){
                return outputChannel.reply(`${client.users.cache.get(playerExists.id).tag} has voted.`)
            } else{
                if (interaction.customId == temp) return outputChannel.reply(`${client.users.cache.get(playerExists.id).tag} has rescinded their vote.`);
                else return outputChannel.reply(`${client.users.cache.get(playerExists.id).tag} has changed their vote.`);
            }
        });

        setTimeout(async () => {
            collector.stop();

            let mayorPlayer = gameCache.inGameRoles.find(player => player.revealed && player.alive);
            if (mayorPlayer) {
                let mayorVote = votes[gameCache.inGameRoles.indexOf(mayorPlayer)];
                if (mayorVote) votes.push(mayorVote, mayorVote);
            }

            const {value} = countMax(votes);
            playerKilled = Array.isArray(value) ? false : (value == 1 ? false : true);
            const promises = [];
            for (const [index, element] of votes.entries()){
                if (index >= gameCache.inGameRoles.length) break;
                const votingPlayer = gameCache.inGameRoles[index];
                if (!votingPlayer.alive) continue;
                switch (element){
                    case 0:
                        promises.push(outputChannel.send(`${votingPlayer.tag} **abstained**.`));
                        break;
                    case 1:
                        promises.push(outputChannel.send(`${votingPlayer.tag} voted **not guilty**.`));
                        break;
                    case 2:
                        promises.push(outputChannel.send(`${votingPlayer.tag} voted **guilty**`));
                        break; 
                } 
            }
            await Promise.all(promises);
            if (playerKilled) return client.emit("deathPhase", playerID, guildID, channelID);
            else return client.emit("lynchPhase", timeLeft, lynchesLeft, guildID, channelID);
            }, 360000);

       

    });
}
