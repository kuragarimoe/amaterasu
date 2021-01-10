const Packet = require("../../src/bancho/Packet");
const Packets = require("../../src/bancho/Packets");
const Constants = require("../../src/util/Constants");
const Router = require("../../src/http/Router");
const RoleMap = require("../../src/structures/bancho/RoleMap");
const { Type } = require("../../src/util/Constants");
const { Hash } = require("../../src/util/Util");
const Player = require("../../src/structures/bancho/Player");
const router = new Router().domain(/^c[e0-9]?(\.ppy\.sh)$/g);

// exempt packets
const EXEMPT = [3, 4];

// documentation:
// generic login response packet id is 5
// usual login response is a short

// main endpoint
router.handle("/", ["POST", "GET"], async(req, res) => {
    if (!req.headers["user-agent"] || req.headers["user-agent"] != "osu!") {
        // request from a browser
        return res.send("Hewwo!");
    };

    if (!req.headers["osu-token"]) { // login request
        let [resp, token] = await login(req.packets[0].toString(), req.headers["x-real-ip"]);

        res.header("cho-token", token); // write token
        
        return res.send(resp instanceof Buffer ? resp : Buffer.concat(resp)) // return packet(s)
    }

    // get player
    let player = glob.players.find(f => f.token == req.headers["osu-token"]);
    if (!player) { // most likely restarted server
        return Buffer.concat([
            glob.packets.notification("The server is restarting.\nPlease wait for it to load."),
            glob.packets.server_restart(0)
        ])
    }

    // handle packets.
    let packets = parsePacket(req.packets[0]);
    for (let p of packets) {
        if (EXEMPT.includes(p.type)) return; // do nothing lol
        if (!Packets[p.type]) {
            return console.log(`ERROR: A packet of type ${p.type} was left unhandled.`);
        }

        Packets[p.type](req, res, p.data);
    }

    let resp = [];
    while (!player.empty())
        resp.push(player.dequeue());

    return res.send(Buffer.concat(resp));
});

async function login(data, ip) {
    // as worded by cmyui, login is special, as we return
    // response bytes in an array.
    data = data.split("\n");
    if (data.length < 3)
        return [glob.packets.login(-1), "0"]; // simply pass invalid credentials, as that's technically right anyways

    let [username, password_hash] = data;
    let extra = data[2].split("|");
    let login_time = Date.now();
    
    // TODO: log out current player if any
    let player = glob.players.find(f => f.safe_username == username.replace(" ", "_").toLowerCase());
    if (player) {

    }

    // login the player.
    if (extra.length < 5)
        return [glob.packets.login(-2), "0"]; // the client is old, and we will not support it.

    let [users, _] = await glob.db.execute(`
        SELECT * FROM users 
        WHERE safe_username = ?
    `, [username.replace(" ", "_").toLowerCase()]);

    // the user doesn't exist.
    if (!users[0])
        return [glob.packets.login(-1), "0"];

    // compare passwords.
    let user = users[0];
    if (!Hash.verify(password_hash, user.password_hash))
        return [glob.packets.login(-1), "0"];

    user.roles = new RoleMap(user.roles.split(","));

    // check if the user is banned
    if (user.roles.has(Constants.Permissions.Banned))
        return [glob.packets.login(-3), "0"];

    // TODO: handle hwid (this is something that requires proper thought)
    // this will be a proven necessity to handle things like MA, to prevent
    // false positivies, but this section needs better upper thought by the
    // team to how it'll be implemented, as it is a complicatedly tough thing
    // to approach, as there are multiple scenarios where the hwid of a user
    // will be the same, such as in a LAN party, or a shared computer.

    // unless a likable method can be handled, we will leave this section empty.

    let plyr = new Player({
        login_time: login_time,
        ...user // spread all the user's data into this object
    }, extra);

    // response
    let resp = [
        glob.packets.login(plyr.id),
        glob.packets.protocol(19),
        glob.packets.bancho_privs(plyr.bancho_privileges()),
        glob.packets.notification("Welcome to osu!katagiri!\nEnjoy your stay. (´･ω･`)\n\nServer Version: " + glob.config._internal.version)
    ];

    // add player in
    glob.players.set(plyr.token, plyr);

    // return data
    return [resp, plyr.token]
}

function parsePacket(packet) {
    var offset = 0;
    var packets = [];

    while (offset < packet.length) {
        packets.push({
            type: packet.readUInt16LE(offset),
            data: new Buffer.from(packet.slice(offset + 7, offset + packet.readUInt32LE(offset + 3) + 7))
        });

        offset += packet.readUInt32LE(offset + 3) + 7;
    }

    return packets;
}

module.exports = router;