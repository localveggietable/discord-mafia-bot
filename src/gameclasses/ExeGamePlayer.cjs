const GamePlayer = require("./GamePlayer.cjs");

class ExeGamePlayer extends GamePlayer{
    constructor(id, tag){
        super("Executioner", id, tag);
        this.won = false;
        this.priority = 0;
        this.faction = "Executioner";
    }

}

module.exports = ExeGamePlayer;