class GamePlayer{
    constructor(role, id, tag, displayName){

        if (Object.getPrototypeOf(this) === GamePlayer.prototype){
            throw new Error("Cannot create an instance of the abstract class GamePlayer.");
        }

        this.alive = true;
        this.will = "";
        this.publicWill = false;
        this.id = id;
        this.tag = tag;
        this.displayName = displayName;
        //indicates the player's actual role
        this.role = role;
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
        //0 indicates no defense, 1 indicates defense 
        this.defense = ["Godfather", "Executioner", "Witch"].includes(role) ? 1 : 0;

        //indicates whether or not retributionist can use the ability.
        this.retributionistCanUse = false;

        this.canSeance = this.role == "Medium" ? true : false;

        this.seanced = false;

        this.validRevengeTarget = false;

        this.overrideWill = false;

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

                await client.users.cache.get(exePlayer.id).send("Your target has been lynched! Your objective is complete and you have won the game."); 
            } else {
                //make executioner a jester
                exePlayer.jester = true;
                exePlayer.role = "Jester";

                await client.users.cache.get(exePlayer.id).send(`Your target has been killed at night, so you have now become a Jester!\nThe following is a description of your role:\n\`\`\`__Jester Description__\nSummary: You are a crazed lunatic whose life goal is to be publicly executed.\nAbilities: Trick the Town into voting against you.\nAttributes: If you are lynched you will attack one of your guilty or abstaining voters the following night with an Unstoppable Attack.\nGoal: Get yourself lynched by any means necessary.\`\`\``);
            }
        } else if (this.jester && lynched){ 
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

    async outputDeath(client, guildID, channelID, reason = false, lynched = true){
        const guild = client.guilds.cache.get(guildID);
        const gameCache = client.games.get(guildID).get(channelID);
        const displayName = gameCache.inGameRoles.find(player => player.id == this.id).displayName;
        const outputChannel = channelID ? guild.channels.cache.find((channel) => {
            return channel.name.split("-")[2] == channelID
        }) : guild.channels.cache.find((channel) => {return channel.name == "tos-channel"});

        let deathMessage = `\`${displayName}\` was killed last night.`;

        switch (reason){
            case "mafia":
                deathMessage = deathMessage + " They were killed by a member of the Mafia.";
                break;
            case "vigilante":
                deathMessage = deathMessage + " They were shot by a Vigilante.";
                break;
            case "veteran":
                deathMessage = deathMessage + " They were killed by a Veteran.";
                break;
            case "executed":
                deathMessage = deathMessage + " They were executed by the Jailor.";
                break;
            case "guilt":
                deathMessage = deathMessage + " They died over the guilt of shooting a town member.";
                break;
            case "jester":
                deathMessage = deathMessage + " They died over the guilt of lynching the Jester.";
                break;
            case "bodyguard":
                deathMessage = deathMessage + " They were killed protecting someone.";
                break;
            case "defender":
                deathMessage = deathMessage + " They were killed by a Bodyguard.";
                break;
            default:
                break;
        }

        await outputChannel.send(deathMessage);
        if (this.cleaned) return outputChannel.send(`\`${displayName}\` was cleaned. We could not determine their role or will`);

        //Let's put this in the events folder
        await outputChannel.send(`\`${displayName}\`'s role was __*${this.role}*__.`);
        let sentWill = this.overrideWill ? this.publicWill : this.will;
        let toWrite = sentWill === "" ? outputChannel.send("We could not find a last will.") : outputChannel.send(`We found a will next to their body:\n\`\`\`${sentWill}\`\`\``);
        await toWrite;
        if (this.jester && lynched) await outputChannel.send("The jester will get its revenge from the grave!"); 
        return; 
    }
}

module.exports = GamePlayer;

