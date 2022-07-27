const GamePlayer = require("./GamePlayer.cjs");

class TownGamePlayer extends GamePlayer{
    constructor(id, role){
        super(id, role);
    }

}

module.exports = TownGamePlayer;