const Packet = require("../Packet");

class UserStatusUpdate {
    constructor(p) {
        // handle packet
    }

    run(req, res, player) {
        return player.enqueue(glob.packets.players.stats(player));
    }
}

module.exports = UserStatusUpdate;