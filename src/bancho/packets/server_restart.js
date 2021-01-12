const { Type } = require("../../util/Constants");
const Packet = require("../Packet")

module.exports = (ms) => {
    let packet = new Packet().id(86);
    packet.write(ms, Type.Int);

    // return packet
    return packet.pack();
}