const { Type } = require("../../util/Constants");
const Packet = require("../Packet");

module.exports = (text) => {
    let packet = new Packet().id(24);
    packet.write(text, Type.String);

    // return packet
    return packet.pack();
}