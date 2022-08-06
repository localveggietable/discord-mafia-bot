const { EmbedBuilder } = require("@discordjs/builders");

class GamePlayer{
    constructor(role, id, tag){

        if (Object.getPrototypeOf(this) === GamePlayer.prototype){
            throw new Error("Cannot create an instance of the abstract class GamePlayer.");
        }

        this.alive = true;
        this.will = "";
        this.id = id;
        this.tag = tag;
        this.role = role;
        this.publicRole = role;
        //this.faction will be initialized inside child classes.
        this.faction = null; 
        //targets refers to nighttime targets. first refers to the first target (player id; snowflake), second refers to the second target (player id; snowflake),
        //binary exists for roles like jailor and veteran (binary), options is a string for miscellaneous options (like for hypnotist).
        this.targets = {
            first: false,
            second: false,
            binary: false,
            options: false
        }
        //0 indicates no defense, 1 indicates basic defense, 2 indicates powerful defense, 3 indicates immovable defense.
        this.defense = 0;

        //see https://town-of-salem.fandom.com/wiki/Ability

    }

    async printWill(outputChannel){
        await outputChannel.send(this.will);
    }

    async handleDeath(client, guildID, channelID){
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

