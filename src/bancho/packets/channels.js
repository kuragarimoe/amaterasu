const { Type } = require("../../util/Constants");
const Packet = require("../Packet");

// channel packets

// to join the channel
// packet id: 64
module.exports.join = (name) => {
    let packet = new Packet().id(64);
    packet.write(name, Type.String);

    // return packet
    return packet.pack();
}

// the channel information
// packet id: 65
module.exports.info = (channel) => {
    let packet = new Packet().id(65);

    // write info
    packet.write(channel.full_name, Type.String);
    packet.write(channel.description, Type.String);
    packet.write(channel.players.size, Type.Int);

    // return packet
    return packet.pack();
}

// to leave the channel
// packet id: 66
module.exports.leave = (name) => {
    let packet = new Packet().id(66);
    packet.write(name, Type.String);

    // return packet
    return packet.pack();
}


// i don't know what this does (TODO: read up on it later (or not))
// packet id: 89
module.exports.end = () => {
    let packet = new Packet().id(89);

    // return packet
    return packet.pack();
}