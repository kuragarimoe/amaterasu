const { Type, Mods } = require("../../util/Constants");
const Packet = require("../Packet");

class ActionUpdate {
    constructor(p) {
        this.p = p;
    }

    run(req, resp, player) {
        let p = this.p;

        player.status.action = p.data.read(Type.Byte);
        player.status.info = p.data.read(Type.String);
        player.status.map.md5 = p.data.read(Type.String);
        player.status.mods = p.data.read(Type.Int);

        // change system
        if (player.status.mods & Mods.Relax) {
            player.status.system = 1; // relax
        } else if (player.status.mods & Mods.Autopilot) {
            player.status.system = 1; // autopilot
        } else player.status.system = 0; // vn
        
        player.status.mode = p.data.read(Type.Byte);
        player.status.map.id = p.data.read(Type.Int);

        // enqueue to everyone
        glob.players.enqueue([glob.packets.players.presence(player), glob.packets.players.stats(player)]);
    }
}

module.exports = ActionUpdate;