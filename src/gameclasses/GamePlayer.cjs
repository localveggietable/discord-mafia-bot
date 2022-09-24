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

        switch (role){
            case "Jailor": case "Janitor": case "Veteran": case "Vigilante":
                this.limitedUses = {limited: true, uses: 3};
                break;
            case "Forger":
                this.limitedUses = {limited: true, uses: 2};
                break;
            case "Doctor": case "Bodyguard":
                this.limitedUses = {limited: true, uses: 1};
                break;
            default:
                this.limitedUses = {limited: false, uses: Infinity};
                break;
        }
        //0 indicates no defense, 1 indicates basic defense, 2 indicates powerful defense, 3 indicates immovable defense.
        this.defense = ["Godfather", "Executioner", "Witch"].includes(role) ? 1 : 0;

        //indicates whether or not retributionist can use the ability.
        this.retributionistCanUse = false;

        this.canSeance = this.role == "Medium" ? true : false;

        this.seanced = false;

        //see https://town-of-salem.fandom.com/wiki/Ability

    }

    async handleDeath(client, guildID, channelID, lynched = false){
        const guild = client.guilds.cache.get(guildID);
        const member = guild.members.cache.get(this.id);

        const outputChannel = channelID ? client.guilds.cache.get(guildID).channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : client.guilds.cache.get(guildID).channels.cache.find((channel) => {return channel.name == "tos-channel"});

        const gameCache = client.games.get(guildID).get(channelID);

        this.blackmailed = false;
        outputChannel.permissionOverwrites.delete(this.id);

        let [aliveRole, deadRole] = [guild.roles.cache.find(role => role.name == "Alive Town Member"), guild.roles.cache.find(role => role.name == "Dead Town Member")];

        let exePlayer = gameCache.inGameRoles.find(player => player.alive && player.faction == "Executioner");

        if (exePlayer && exePlayer.targetID == this.id) {
            if (lynched){
                exePlayer.won = true;
            } else {
                //make executioner a jester
                exePlayer.jester = true;
            }
        } else if (this.faction == "Executioner" && this.jester && lynched){ 
            this.won = true;
            this.canRevenge = true;
        }
        
        this.alive = false;
        //Below line throwing error
        this.retributionistCanUse = (["Investigator", "Lookout", "Sheriff", "Spy", "Vigilante", "Bodyguard", "Doctor", "Escort"].includes(this.role)) ? true : false;

        outputChannel.permissionOverwrites.delete(member.id);

        await Promise.all([member.roles.remove(aliveRole), member.roles.add(deadRole)]);
        return this;
    }

    async outputDeath(client, guildID, channelID){
        const guild = client.guilds.cache.get(guildID);
        const member = guild.members.cache.get(this.id);
        const outputChannel = channelID ? guild.channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : guild.channels.cache.find((channel) => {return channel.name == "tos-channel"});

        if (this.cleaned) return outputChannel.send(`${member.user.tag} was cleaned. We could not determine their role or will`);
        
        const will = this.publicWill === "" ? null : new EmbedBuilder()
            .setColor(10070709)
            .setTitle(`${member.user.tag}'s Will`)
            .addFields({value: this.publicWill});

        //Let's put this in the events folder
        outputChannel.send(`${member.user.tag}'s role was **${this.publicRole}**`)
        let toWrite = this.publicWill === "" ? outputChannel.send("We could not find a last will.") : outputChannel.send({content: `We found a will next to their body.`, embeds: [will]});
        await toWrite;
        return outputChannel.send(`${member.user.tag}'s role was **${this.publicRole}**`); 
    }
}

module.exports = GamePlayer;

