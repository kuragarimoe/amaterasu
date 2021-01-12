const { Type } = require("../../util/Constants");
const Packet = require("../Packet");

/// users packets
//  responses:
// -1: authentication failed
// -2: old client
// -3: banned
// -4: banned
// -5: error occurred
// -6: needs supporter
// -7: password reset
// -8: requires verification
// everything else is a valid id

module.exports = (response) => {
    let packet = new Packet().id(5);
    packet.write(response, Type.Int);

    // return packet
    return packet.pack();
}