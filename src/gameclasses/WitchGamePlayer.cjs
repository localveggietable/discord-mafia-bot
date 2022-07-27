const GamePlayer = require("./GamePlayer.cjs");

class WitchGamePlayer extends GamePlayer{
    constructor(id){
        super(id, "Witch");
    }
}