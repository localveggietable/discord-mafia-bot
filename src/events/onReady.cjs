module.exports = async function(client){
    client.on("ready", () => 
        {
            console.log(`${client.user.tag} is up and running!`);
            try {
                const outputChannel = client.channels.cache.find((channel) => {return channel.name == "tos-channel"});
                outputChannel.send(`${client.user.name} is online!`);
            } catch {
                console.log("Client server has not created tos-chanel.")
            }
        }
    );
}