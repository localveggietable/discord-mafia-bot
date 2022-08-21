const {promisify} = require("util");
const MafiaGamePlayer = require("../gameclasses/MafiaGamePlayer.cjs");

const delay = promisify(setTimeout);

module.exports = function(client){
    client.on("gameNighttime", async (guildID, channelID) => {
        //useful object references
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});

        const mafiaChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID && channel.name.split("-")[0] == "mafia";
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "mafia-tos-channel"});

        const jailorChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID && channel.name.split("-")[0] == "jailor";
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "jailor-tos-channel"}); 

        const deadChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID && channel.name.split("-")[0] == "dead";
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "dead-tos-channel"}); 

        const gameCache = client.games.get(guildID).get(channelID);

        const aliveRoleName = channelID ? `Alive Town Member ${channelID}`: "Alive Town Member";
 
        const firstNight = gameCache.day;

        //Tell the game cache that it is now nighttime.
        gameCache.isDaytime = false;

        //set permissions of different channels. The first one is jailor channel.

        let jailor = gameCache.inGameRoles.find(player => player.role == "Jailor");
        let jailedPlayer = (jailor.alive && jailor.targets.first) ? gameCache.inGameRoles.find(player => player.id == jailor.targets.first) : null;
        
        if (jailor.alive && jailor.targets.first) {
            let jailorWritePermissions = [];
            jailorWritePermissions.push(mafiaChannel.permissionOverwrites.edit(jailor.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true
            }));

            jailorWritePermissions.push(mafiaChannel.permissionOverwrites.edit(jailor.targets.first, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true
            }));

            await Promise.all(jailorWritePermissions);     
        }

        //next, let's do th mafia channel
        let aliveMafiaPlayerIDs = gameCache.inGameRoles.filter(player => player.faction == "Mafia" && player.alive == true && player != jailedPlayer).map(player => player.id);
        let mafiaWritePermissions = [];
        for (const playerID of aliveMafiaPlayerIDs){
            mafiaWritePermissions.push(mafiaChannel.permissionOverwrites.edit(playerID, {
                SEND_MESSAGES: true
            })); 
        }

        let aliveMediumPlayerIDs = gameCache.inGameRoles.filter(player => player.role == "Medium" && player.alive && player != jailedPlayer).map(player => player.id);
        let mediumWritePermissions = [];
        for (const playerID of aliveMediumPlayerIDs){
            mediumWritePermissions.push(deadChannel.permissionOverwrites.edit(playerID, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true
            }));
        }

        await Promise.all(mafiaWritePermissions.concat(mediumWritePermissions));

        try {
            await outputChannel.permissionOverwrites.edit(client.guilds.cache.get(guildID).roles.cache.find(role => role.name == aliveRoleName).id, {
                SEND_MESSAGES: false
            });
        } catch (e) {
            await outputChannel.send("Someone messed with the channel roles needed to run this game :/ . This game will be aborted.");
            return client.emit("onEndGameError", guildID, channelID);
        }

        //make sure all the permissions promises finish before continuing -----------------------------------------------------

        //we have to attach a listener to each message
        let collectors = [];

        let roleActionMessages = [];
        for (let player of gameCache.inGameRoles){
            if (player.role == "Mafia" || player.alive || player == jailedPlayer) continue;
            else {
                let msgValue = player.resolveNighttimeOptions?.(gameCache.inGameRoles, firstNight);
                if (!msgValue) continue;
                let msgRef = await client.users.cache.get(player.id).send(msgValue);
                roleActionMessages.push([player, msgRef]);
            }
        }

        for (let [player, msg] of roleActionMessages){
            const collector = msg.createMessageComponentCollector({componentType: "BUTTON"});
            collector.on("collect", (interaction) => {
                if (interaction.user.id != player.id) return interaction.followUp("You can't click this button!");
                if (interaction.customId == "clear"){
                    player.targets = {first: false, second: false, binary: false, options: false}; 
                    return interaction.followUp("Your selection was cleared."); 
                }
                if (["Witch", "Transporter"].includes(player.role)){
                    if (!player.targets.first) {
                        player.targets.first = +interaction.customId;
                        let followUpMessage = player.role == "Witch" ? `You have decided to take control of ${client.users.cache.get(+interaction.customId).tag} tonight.` : `You have decided to transport ${client.users.cache.get(+interaction.customId).tag} tonight.`;
                        return interaction.followUp(followUpMessage);
                    }
                    player.targets.second = +interaction.customId;
                    let followUpMessage = player.role == "Witch" ? `You have decided to target ${client.users.cache.get(+interaction.customId).tag} tonight.` : `You have decided to transport ${client.users.cache.get(+interaction.customId).tag} tonight.`;
                    return interaction.followUp(followUpMessage);
                } else if (["Veteran, Jailor"].includes(player.role)){
                    player.targets.binary = interaction.customId == 1 ? true : false;
                    if (player.role == "Jailor" && interaction.customID == 1) {
                        jailorChannel.send("The jailor has decided to execute you.")
                    } else if (player.role == "Jailor"){
                        jailorChannel.send("The jailor has decided to spare you.")
                    }
                    return interaction.followUp("Your decision has been recorded.");
                } else if (player.role == "Retributionist"){
                    let clickedTarget = interaction.customId.slice(0, 6) == "target" ? true : false;
                    let buttonID = clickedTarget ? interaction.customId.slice(6) : interaction.customId;

                    if (clickedTarget){
                        player.targets.second == +buttonID;
                        return interaction.followUp("Your decision has been recorded");
                    } else {
                        player.targets.first == +buttonID;
                        return interaction.followUp("Your decision has been recorded");
                    }

                } else {
                    player.targets.first = +interaction.customId;
                    return interaction.followUp("Your decision has been recorded.");
                }
            });
            collectors.push(collector);
        }

        let mafiaRoleActionMessageContent = MafiaGamePlayer.resolveNighttimeOptions(gameCache.inGameRoles); 
        let mainMafiaRoleActionMessageContent = mafiaRoleActionMessageContent.pop();

        let mainMafiaMessage = await mafiaChannel.send(mainMafiaRoleActionMessageContent[1]);

        const mainMafiaCollector = mainMafiaMessage.createMessageComponentCollector({componentType: "BUTTON"});
        collectors.push(mainMafiaCollector);

        mainMafiaCollector.on("collect", (interaction) => {
            let player = mainMafiaRoleActionMessageContent[0].find(player => player.id == interaction.user.id);
            if (!player) return interaction.followUp({content: "You can't click this button!", ephemeral: true});
            let actionPlayer = mainMafiaRoleActionMessageContent[0].find(player => player.role == "Mafia");
            if (interaction.customId == "clear"){
                actionPlayer.targets = {first: false, second: false, binary: false, options: false}; 
                return interaction.followUp("Your selection was cleared."); 
            } 
            actionPlayer.targets.first = +interaction.customId;
            return interaction.followUp("Your decision has been recorded.");       
        });

        for (let [player, msg] of mafiaRoleActionMessageContent){
            let msgRef = await mafiaChannel.send(msg);
            const collector = msgRef.createMessageComponentCollector({componentType: "BUTTON"});
            collector.on("collect", (interaction) => {
                if (interaction.user.id != player.id) return interaction.followUp({content: "You can't click this button!", ephemeral: true});
                if (interaction.customId == "clear"){
                    player.targets = {first: false, second: false, binary: false, options: false}; 
                    return interaction.followUp("Your selection was cleared."); 
                }

                if (player.role == "Disguiser"){
                    if (!player.targets.first) {
                        if (gameCache.inGameRoles.find(player => player.id == interaction.customId).role == "Mafia") return interaction.followUp("You have to choose a mafia member as your first target.");
                        player.targets.first = +interaction.customId;
                        return interaction.followUp("You have chosen your mafia member to disguise.");
                    }

                    if (gameCache.inGameRoles.find(player => player.id == interaction.customId).role == "Mafia") return interaction.followUp("You can only disguise Mafia members as non-Mafia members.");
                    player.targets.second = +interaction.customId;
                    return interaction.followUp("You have chosen who your mafia member will be disguised as."); 
                } else if (player.role == "Hypnotist"){
                    if (["transport", "guard", "block", "heal", "witch"].indexOf(interaction.customId)){
                        player.targets.options = interaction.customId;
                        return interaction.followUp("You have chosen which message your target will see.");
                    } else {
                        player.targets.first = +interaction.customId;
                        return interaction.followUp("You have chosen which town member will be hypnotized.");
                    }
                } else {
                    player.targets.first = +interaction.customId;
                    return interaction.followUp("Your decision has been recorded.");
                }

            });
            collectors.push(collector);
        }

        await delay(45000);

        collectors.forEach(collector => collector.stop());
        
        let denyMafiaWritePermissions = [], denyMediumWritePermissions = [], denyJailorWritePermissions;
        for (const playerID of aliveMafiaPlayerIDs){
            denyMafiaWritePermissions.push(mafiaChannel.permissionOverwrites.edit(playerID, {
                SEND_MESSAGES: false
            }));
        }

        for (const playerID of aliveMediumPlayerIDs){
            denyMediumWritePermissions.push(playerID, {
                SEND_MESSAGES: false,
                VIEW_CHANNEL: false
            });
        }

        denyJailorWritePermissions.push(mafiaChannel.permissionOverwrites.edit(jailor.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true
        }));

        denyJailorWritePermissions.push(mafiaChannel.permissionOverwrites.edit(jailor.targets.first, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true
        }));

        await Promise.all(denyMafiaWritePermissions.concat(denyMafiaWritePermissions, denyJailorWritePermissions));

        let deleted;
        do {
            deleted = await jailorChannel.bulkDelete(100);
        } while (deleted.size > 0);

        return client.emit("gameDaytime", false, guildID, channelID);

    });
}