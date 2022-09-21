module.exports = function(client){
    client.on("roleDelete", async (role) => {
        let member;
        try {
            const log = await role.guild.fetchAuditLogs({ 
                type: "ROLE_DELETE"
            });
            member = role.guild.members.resolve(log.entries.first().executor);
        } catch (err) {
            console.log(err);
        }
        if (!member) member = null;

        if (member.id == client.user.id) return;
        if (new RegExp("^(Alive Town Member( [1-9])?|Dead Town Member( [1-9])?)$").test(role.name)){
            const gamesDataCollection = client.games.get(role.guild.id);

            if (!gamesDataCollection) return;
            for (const [channelID, gameData] of gamesDataCollection.entries()){
                if (!gameData.ongoing) continue;
                client.emit("endGameError", role.guild.id, channelID);
            }
        }
    });
}