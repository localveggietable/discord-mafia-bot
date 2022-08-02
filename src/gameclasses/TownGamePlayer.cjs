const GamePlayer = require("./GamePlayer.cjs");

class TownGamePlayer extends GamePlayer{
    constructor(id, role){
        super(id, role);
        this.faction = "Town";
    }

}

module.exports = TownGamePlayer;