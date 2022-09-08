const GamePlayer = require("./GamePlayer.cjs");

class ExeGamePlayer extends GamePlayer{
    constructor(id, tag, targetID){
        super("Executioner", id, tag);
        this.won = false;
        this.jester = false;
        this.priority = 0;
        this.faction = "Executioner";
        this.targetID = targetID;
        this.canRevenge = false;
    }

}

module.exports = ExeGamePlayer;