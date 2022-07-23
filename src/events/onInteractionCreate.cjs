const { InteractionType } = require("discord-api-types/v10");

module.exports = async function(client){
    client.on("interactionCreate", async (interaction) => {
        if (!(interaction.type == InteractionType.ApplicationCommand)) return;

        await interaction.deferReply();

        var params = [];
        const options = interaction.options.data;
        const scriptToRun = client.commands.get(interaction.commandName).execute;

        for (let option in options){
            switch (option.type){
                case "USER":
                    params.push(option.user);
                    break;
                
                default:
                    params.push(option.value);
                    break;
            }
        }

        scriptToRun(interaction.member, params);
    });
}