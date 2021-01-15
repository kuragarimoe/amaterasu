const { Type } = require("../../util/Constants");
const Packet = require("../Packet");

class RequestUpdates {
    constructor(p) {
        this.val = p.data.read(Type.Int)
    }

    run(req, resp, player) {
        console.log(this.val)
        return;
    }
}

module.exports = RequestUpdates;