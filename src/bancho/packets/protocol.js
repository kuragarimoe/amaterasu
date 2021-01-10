const { Type } = require("../../util/Constants");
const Packet = require("../Packet")

module.exports = (ver) => {
    let packet = new Packet(75);
    packet.write(ver, Type.Int);

    // return packet
    return packet.pack();
}