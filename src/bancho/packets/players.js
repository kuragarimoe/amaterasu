const { Type } = require("../../util/Constants");
const Packet = require("../Packet")

// player packets

// user stats
// packet id: 11
module.exports.stats = (player) => {
    let packet = new Packet().id(11);

    // player stats
    let stats = player.stats();

    // write data
    packet.write(player.id, Type.Int); // player id
    packet.write(player.status.action, Type.Byte); // what is the player doing?
    packet.write(player.status.info, Type.String); // ???
    packet.write(player.status.map.md5, Type.String); // md5 of the current map
    packet.write(player.status.map.md5, Type.Int); // user's mod values
    packet.write(player.status.mode, Type.Byte); // the mode the user is playing right now
    packet.write(player.status.map.id, Type.Int); // map id
    packet.write(stats.rscore, Type.Long); // ranked score
    packet.write(stats.acc, Type.Float); // accuracy
    packet.write(stats.plays, Type.Int); // play count
    packet.write(stats.tscore, Type.Long); // total score
    packet.write(player.rank || 0, Type.Long); // player rank
    packet.write(stats.pp || 0, Type.Short); // pp; why is pp a short?
    
    // pack data
    return packet.pack();
}

// user presense
// packet id: 83
module.exports.presence = (player) => {
    let packet = new Packet().id(83);
    
    // write data
    packet.write(player.id, Type.Int); // player id
    packet.write(player.username, Type.String); // player name
    packet.write(player.utc_offset + 24, Type.Byte) // utc offset
    packet.write(0, Type.Byte); // country integer (will figure out later)
    packet.write(player.bancho_privileges(), Type.Byte);
    packet.write(0.00, Type.Float) // Longitude
    packet.write(0.00, Type.Float) // Latitude
    packet.write(player.rank || 0, Type.Float) // Player Rank

    // pack data
    return packet.pack();
}

// send message
// packet id: 7
module.exports.send = (player, message, channel) => {
    let packet = new Packet().id(12);

    // write data
    packet.write(player.name, Type.String); // player name
    packet.write(message, Type.String); // message
    packet.write(channel.name, Type.String); // target channel
    packet.write(player.id, Type.Int); // player id

    // pack data
    return packet.pack();
}

// logout
// packet id: 12
module.exports.logout = (player) => {
    let packet = new Packet().id(12);

    // write data
    packet.write(player.id, Type.Int); // the id
    packet.write(0, Type.Byte); // a 0

    // pack data
    return packet.pack();
}