const GamePlayer = require("./GamePlayer.cjs");

class MafiaGamePlayer extends GamePlayer{ 
    constructor(id, role){
        super(id, role);
        this.faction = "Mafia"
    }

}

module.exports = MafiaGamePlayer;