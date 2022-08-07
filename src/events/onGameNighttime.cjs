const {promisify} = require("util");
const MafiaGamePlayer = require("../gameclasses/MafiaGamePlayer.cjs");

const delay = promisify(setTimeout);

module.exports = function(client){
    client.on("gameNighttime", async (firstNight, guildID, channelID) => {
        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});

        const mafiaChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[3] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "mafia-tos-channel"});

        const gameCache = client.games.get(guildID).get(channelID);
        let aliveMafiaPlayerIDs = gameCache.inGameRoles.filter(player => player.faction == "Mafia" && player.alive == true).map(player => player.id);

        //set permissions of different channels
        const mafiaWritePermissions = [];
        const generalWritePermissions = [];
        for (const playerID of aliveMafiaPlayerIDs){
            mafiaWritePermissions.push(mafiaChannel.permissionOverwrites.edit(playerID, {
                SEND_MESSAGES: true
            }));
        }
        for (const player of gameCache.inGameRoles){
            generalWritePermissions.push(outputChannel.permissionOverwrites.edit(player.id, {
                SEND_MESSAGES: false
            }));
        }

        await Promise.all(mafiaWritePermissions);
        await Promise.all(generalWritePermissions);


        //we have to attach a listener to each message
        let collectors = [];

        let roleActionMessages = [];
        for (let player of gameCache.inGameRoles){
            if (player.role == "Mafia" || player.alive) continue;
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
                if (["Witch", "Transporter"].indexOf(player.role)){
                    if (!player.targets.first) {
                        player.targets.first = +interaction.customId;
                        let followUpMessage = player.role == "Witch" ? `You have decided to take control of ${client.users.cache.get(+interaction.customId).tag} tonight.` : `You have decided to transport ${client.users.cache.get(+interaction.customId).tag} tonight.`;
                        return interaction.followUp(followUpMessage);
                    }
                    player.targets.second = +interaction.customId;
                    let followUpMessage = player.role == "Witch" ? `You have decided to target ${client.users.cache.get(+interaction.customId).tag} tonight.` : `You have decided to transport ${client.users.cache.get(+interaction.customId).tag} tonight.`;
                    return interaction.followUp(followUpMessage);
                } else if (["Veteran, Jailor"].indexOf(player.role)){
                    player.targets.binary = interaction.customId == 1 ? true : false;
                    return interaction.followUp("Your decision has been recorded.");
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
                        player.targets.first = +interaction.customId;
                        return interaction.followUp("You have chosen your mafia member to disguise.");
                    }
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
        
        let denyMafiaWritePermissions = [];
        for (const playerID of aliveMafiaPlayerIDs){
            denyMafiaWritePermissions.push(mafiaChannel.permissionOverwrites.edit(playerID, {
                SEND_MESSAGES: false
            }));
        }

        await Promise.all(denyMafiaWritePermissions);

        return client.emit("gameDaytime", false, guildID, channelID);

    });
}