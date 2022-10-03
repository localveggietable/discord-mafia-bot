module.exports = function(client){
    client.on("interactionCreate", async (interaction) => {
        
        if (!interaction.isCommand()) return;

        await interaction.deferReply().catch(() => {});

        var params = [];
        const options = interaction.options.data;
        const scriptToRun = client.commands.get(interaction.commandName).execute;

        for (const option of options){
            switch (option.type){
                //The subcommand case needs to be tested, as I'm not sure if it should be this or option.options?.data.forEach
                case "SUB_COMMAND": 
                    params.push(option.name);
                    option.options?.forEach(suboption => {
                        params.push(suboption.type == "USER" ? suboption.user : suboption.value);
                    });
                    break;
                case "USER":
                    params.push(option.user);
                    break;
                default:
                    params.push(option.value);
                    break;
            }
        }
        
        try {
            await scriptToRun(client, interaction, params);
        } catch (e){
            console.log(e);
        }
    });
}