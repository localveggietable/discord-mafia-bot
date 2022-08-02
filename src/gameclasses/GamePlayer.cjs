const { EmbedBuilder } = require("@discordjs/builders");

class GamePlayer{
    constructor(id, role){

        if (Object.getPrototypeOf(this) === GamePlayer.prototype){
            throw new Error("Cannot create an instance of the abstract class GamePlayer.");
        }

        this.alive = true;
        this.will = "";
        this.id = id;
        this.role = role;
        this.faction = null;
        
    }

    whisper(){
        
    }

    writeWill(msg){

    }

    rewriteWill(msg){

    }

    async printWill(outputChannel){
        await outputChannel.send(this.will);
    }

    async handleDeath(client, guildID, channelID, cleaned = false){
        const guild = client.guilds.cache.get(guildID);
        const member = guild.members.cache.get(this.id);

        const outputChannel = channelID ? guild.channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : guild.channels.cache.find((channel) => {return channel.name == "tos-channel"});

        let [aliveRole, deadRole] = [guild.roles.cache.find(role => role.name == "Alive Town Member"), guild.roles.cache.find(role => role.name == "Dead Town Member")];

        this.alive = false;
        await Promise.all([member.roles.remove(aliveRole), member.roles.add(deadRole)]);

        const will = this.will === "" ? null : new EmbedBuilder()
            .setColor(10070709)
            .setTitle(`${member.user.tag}'s Will`)
            .addFields({value: this.will});

        
        const toWrite = this.will === "" ? outputChannel.send("We could not find a last will.") : outputChannel.send({content: `We found a will next to their body.`, embeds: [will]});
        await toWrite;

        await outputChannel.send(`${member.user.tag}'s role was **${this.role}**`);

    }
}


module.exports = GamePlayer;

