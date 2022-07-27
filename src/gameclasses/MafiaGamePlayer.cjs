const GamePlayer = require("./GamePlayer.cjs");

class MafiaGamePlayer extends GamePlayer{ 
    constructor(id, role){
        super(id, role);
    }

}

module.exports = MafiaGamePlayer;