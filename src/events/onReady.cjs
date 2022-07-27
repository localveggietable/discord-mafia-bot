module.exports = async function(client){
    client.on("ready", async () => 
        {
            console.log(`${client.user.tag} is up and running!`);
            try {
                const outputChannel = client.channels.cache.find((channel) => {return channel.name == "tos-channel"});
                outputChannel.send(`${client.user.username} is online! For help, enter the command \\tos-help`);
            } catch {
                console.log("Client server has not created tos-chanel.")
            }
        }
    );
}