const { ComponentType, MessageActionRow, MessageButton } = require("discord.js");
const { countMax } = require("../util/countMax.cjs");


module.exports = function(client){
    client.on("votingPhase", async (playerID, lynchesLeft, timeLeft, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
            }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});
        const gameCache = client.games.get(guildID).get(channelID);
        let time = 20;

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
        const collector = voteMessage.createMessageComponentCollector({componentType: ComponentType.Button});

        collector.on("collect", async (interaction) => {
            let playerExists = gameCache.inGameRoles.find((player) => {
                return player.alive && (player.id == interaction.user.id);
            });
            if (!playerExists) return interaction.reply({content: "You can't click this button!", ephemeral: true});

            let playerNumber = gameCache.inGameRoles.indexOf(playerExists);
            let temp = votes[playerNumber];
            votes[playerNumber] = +interaction.customId;

            if (!temp){
                await outputChannel.send(`${client.users.cache.get(playerExists.id).tag} has voted.`)
            } else{
                if (interaction.customId == temp) await outputChannel.send(`${client.users.cache.get(playerExists.id).tag} has rescinded their vote.`);
                else await outputChannel.send(`${client.users.cache.get(playerExists.id).tag} has changed their vote.`);
            } 
        });

        const interval = setInterval(async () => {
            if (!(--time)){
                const { value } = countMax(votes);
                playerKilled = Array.isArray(value) ? false : (value == 1 ? false : true);
                const promises = [];
                for (const [index, element] of votes.entries()){
                    switch (element){
                        case 0:
                            promises.push(outputChannel.send(`${client.users.cache.get(gameCache.inGameRoles[index].id).tag} **abstained**.`));
                            break;
                        case 1:
                            promises.push(outputChannel.send(`${client.users.cache.get(gameCache.inGameRoles[index].id).tag} voted **not guilty**.`));
                            break;
                        case 2:
                            promises.push(outputChannel.send(`${client.users.cache.get(gameCache.inGameRoles[index].id).tag} voted **guilty**`));
                             break;
                    }
                }
                await Promise.all(promises);
                if (playerKilled) client.emit("deathPhase", playerID, guildID, channelID);
                else client.emit("lynchPhase", timeLeft, lynchesLeft, guildID, channelID);
                clearInterval(interval);
            }
        }, 1000);
    });
}