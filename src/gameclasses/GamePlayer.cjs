const { EmbedBuilder } = require("@discordjs/builders");

class GamePlayer{
    constructor(role, id, tag){

        if (Object.getPrototypeOf(this) === GamePlayer.prototype){
            throw new Error("Cannot create an instance of the abstract class GamePlayer.");
        }

        this.alive = true;
        this.will = "";
        this.publicWill = "";
        this.id = id;
        this.tag = tag;
        //indicates the player's actual role
        this.role = role;
        //indicates the player's public role (for death purposes only - for instance, implementing the disguiser ability won't be done using this property)
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

        //.cleaned should be either false or a player object (the player who did the cleaning).
        this.cleaned = false;

        this.blackmailed = false;

        //indicates whether or not the player is to be jailed
        this.jailed = false;

        this.limitedUses = ["Jailor", "Veteran", "Vigilante", "Janitor"].includes(role) ? {limited: true, uses: 3} : ["Doctor", "Bodyguard"].includes(role) ? {limited: true, uses: 1} : {limited: false, uses: 0};
        //0 indicates no defense, 1 indicates basic defense, 2 indicates powerful defense, 3 indicates immovable defense.
        this.defense = ["Godfather", "Executioner", "Witch"].includes(role) ? 1 : 0;

        //see https://town-of-salem.fandom.com/wiki/Ability

    }

    async printWill(outputChannel){
        await outputChannel.send(this.will);
    }

    //i think i want to split handledeath into handledeath and outputdeath to separate handling node-side state vs. client-side state.
    async handleDeath(client, guildID, channelID){
        const guild = client.guilds.cache.get(guildID);
        const member = guild.members.cache.get(this.id);

        const outputChannel = channelID ? guild.channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : guild.channels.cache.find((channel) => {return channel.name == "tos-channel"});

        let [aliveRole, deadRole] = [guild.roles.cache.find(role => role.name == "Alive Town Member"), guild.roles.cache.find(role => role.name == "Dead Town Member")];

        this.alive = false;
        await Promise.all([member.roles.remove(aliveRole), member.roles.add(deadRole)]);
    }

    async outputDeath(client, guildID, channelID){
        const guild = client.guilds.cache.get(guildID);
        const member = guild.members.cache.get(this.id);
        const outputChannel = channelID ? guild.channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : guild.channels.cache.find((channel) => {return channel.name == "tos-channel"});
        
        const will = this.publicWill === "" ? null : new EmbedBuilder()
            .setColor(10070709)
            .setTitle(`${member.user.tag}'s Will`)
            .addFields({value: this.publicWill});

        //Let's put this in the events folder
        let toWrite = this.publicWill === "" ? outputChannel.send("We could not find a last will.") : outputChannel.send({content: `We found a will next to their body.`, embeds: [will]});
        await toWrite;
        outputChannel.send(`${member.user.tag}'s role was **${this.publicRole}**`); 
    }
}

module.exports = GamePlayer;

