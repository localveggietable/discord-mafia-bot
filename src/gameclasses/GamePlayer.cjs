const { EmbedBuilder } = require("@discordjs/builders");

var actionRoleObject = {
    Investigator: "To investigate someone's role, DM me the command /investigator [player tag].",
    Lookout: "To watch someone at night, use the slash command /lookout <player tag>",
    Sheriff: "To check a person of suspicious activity, use the slash command /sheriff <player tag>",
    Spy: "To bug a player, use the slash command /spy <player tag>",
    Jailor: "To execute a player, use the slash command /execute",
    Veteran: "To go on alert, use the slash command /veteran",
    Vigilante: "You spend the night polishing your gun so you cannot shoot anyone. To shoot someone (starting next night), use the slash command /vigilante <player tag>",
    Bodyguard: "To protect someone, use the slash command /bodyguard <player tag>",
    Doctor: "To heal someone, use the slash command /doctor <player tag>",
    Escort: "To distract someone, use the slash command /escort <player tag>",
    Retributionist: "To use a dead town member's abilities, use the slash command /retributionist <player tag>",
    Transporter: "To transport two people, use the slash command /transporter <player tag 1> <player tag 2>",
    Disguiser: "To disguise a mafia member, use the slash command /disguiser <player tag>",
    Forger: "To forge someone's will, use the slash command /forger <player tag> <string delimited by double quotes (\" \")>",
    Hypnotist: "To hypnotize someone, use the slash command /hypnotist ",
    Janitor: "To clean someone, use the slash command /",
    Ambush: "To ambush someone, use the slash command / ",
    Godfather: "To kill someone, use the slash command /",
    Mafioso: "To vote to kill someone, use the slash command /",
    Blackmailer: "To blackmail someone, use the slash command /",
    Consigliere: "To investigate someone, use the slash command /",
    Consort: "To disctract someone, user the slash command /"
};

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
        //0 indicates no defense, 1 indicates basic defense, 2 indicates powerful defense, 3 indicates immovable defense.
        this.defense = 0;

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

