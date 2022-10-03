module.exports = function(client){
    client.on("ready", () => {
            console.log(`${client.user.tag} is up and running!`);
        }
    );
}