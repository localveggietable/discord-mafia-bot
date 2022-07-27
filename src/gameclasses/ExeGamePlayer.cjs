const GamePlayer = require("./GamePlayer.cjs");

class ExeGamePlayer extends GamePlayer{
    constructor(id){
        super(id, "Executioner");
    }

}

module.exports = ExeGamePlayer;