const { Type } = require("../../util/Constants");
const Packet = require("../Packet")

// player packets

// user stats
// packet id: 11
module.exports.stats = (player) => {
    let packet = new Packet().id(11);

    if (player.bot) { // bot accounts are special
        packet.write(player.id, Type.Int)
            .write(4, Type.Byte)
            .write("", Type.String)
            .write("", Type.String) 
            .write(0, Type.Int)
            .write(0, Type.Byte)
            .write(0, Type.Int)
            .write(0, Type.Long)
            .write(0, Type.Float)
            .write(1, Type.Int)
            .write(0, Type.Long)
            .write(0, Type.Int)
            .write(0, Type.Short);

        // pack bot data
        return packet.pack();
    }

    // player stats
    let stats = player.stats();

    if (!stats) {
        return;
    }

    // write data
    packet.write(player.id, Type.Int) // player id
        .write(player.status.action, Type.Byte) // what is the player doing?
        .write(player.status.info, Type.String) // action info text
        .write(player.status.map.md5, Type.String) // md5 of the current map
        .write(player.status.mods || 0, Type.Int) // user's mod values
        .write(player.status.mode, Type.Byte) // the mode the user is playing right now
        .write(player.status.map.id, Type.Int) // map id
        .write(stats.ranked_score, Type.Long) // ranked score
        .write(stats.acc, Type.Float) // accuracy
        .write(stats.plays, Type.Int) // play count
        .write(stats.total_score, Type.Long) // total score
        .write(player.rank || 0, Type.Int) // player rank
        .write(stats.pp || 0, Type.Short); // pp; why is pp a short?

    // pack data
    return packet.pack();
}

// user presense
// packet id: 83
module.exports.presence = (player) => {
    let packet = new Packet().id(83);

    if (player.bot) { // bots
        packet.write(player.id, Type.Int) // player id
            .write(player.name, Type.String) // player name
            .write(-8 + 24, Type.Byte) // utc offset
            .write(0, Type.Byte) // country integer (will figure out later)
            .write(player.bancho_privileges(), Type.Byte)
            .write(0.00, Type.Float) // Longitude
            .write(0.00, Type.Float) // Latitude
            .write(1, Type.Int); // Player Rank

        // return bot packet
        return packet.pack();
    }

    // write data
    packet.write(player.id, Type.Int) // player id
        .write(player.name, Type.String) // player name
        .write(player.utc_offset + 24, Type.Byte) // utc offset
        .write(0, Type.Byte) // country integer (will figure out later)
        .write(player.bancho_privileges(), Type.Byte)
        .write(0.00, Type.Float) // Longitude
        .write(0.00, Type.Float) // Latitude
        .write(player.rank || 0, Type.Int); // Player Rank

    // pack data
    return packet.pack();
}

// send message
// packet id: 7
module.exports.send = (player, message, channel) => {
    let packet = new Packet().id(7);

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