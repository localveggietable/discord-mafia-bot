const GamePlayer = require("./GamePlayer.cjs");

class ExeGamePlayer extends GamePlayer{
    constructor(id, tag){
        super("Executioner", id, tag);
        this.won = false;
    }

}

module.exports = ExeGamePlayer;