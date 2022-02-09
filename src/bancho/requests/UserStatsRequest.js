const { Type } = require("../../util/Constants");
const Packet = require("../Packet");

class UserStatsRequest {
    constructor(p) {
        // handle packet
        this.packet = p.data;
    }

    run(req, res, player) {
        let ids = this.packet.read(Type.Short)
        let players = [];

        for (let i = 0; i < ids; i++) {
            let id = this.packet.read(Type.Int);
            let player = glob.players.get(id);

            if (player && player.online == true) {
                players.push(player);
            } 
        }

        for (let p of players) {
            player.enqueue(glob.packets.players.stats(p))
        }
    }
}

module.exports = UserStatsRequest;