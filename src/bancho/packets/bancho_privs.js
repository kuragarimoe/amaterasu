const { Type } = require("../../util/Constants");
const Packet = require("../Packet")


module.exports = (priv) => {
    let packet = new Packet(71);
    packet.write(priv, Type.Int);

    // return packet
    return packet.pack();
}