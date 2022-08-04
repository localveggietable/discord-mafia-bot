const GamePlayer = require("./GamePlayer.cjs");

class WitchGamePlayer extends GamePlayer{
    constructor(id, tag){
        super("Witch", id, tag);
    }
}

module.exports = WitchGamePlayer;