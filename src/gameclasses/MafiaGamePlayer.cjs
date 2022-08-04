const GamePlayer = require("./GamePlayer.cjs");

class MafiaGamePlayer extends GamePlayer{ 
    constructor(role, id, tag){
        super(role, id, tag);
        this.faction = "Mafia"
    }

}

module.exports = MafiaGamePlayer;