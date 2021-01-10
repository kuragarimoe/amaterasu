const Packet = require("../Packet");

class StatusUpdate {
    constructor(data) {
        this.packet = Packet.template(data, [

        ]);
    }
}

module.exports = StatusUpdate;