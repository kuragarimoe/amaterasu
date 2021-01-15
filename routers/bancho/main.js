// modules
const fs = require("fs");


const Packet = require("../../src/bancho/Packet");
const Packets = require("../../src/bancho/Packets");
const Constants = require("../../src/util/Constants");
const Router = require("../../src/http/Router");
const RoleMap = require("../../src/structures/bancho/RoleMap");
const { Hash } = require("../../src/util/Util");
const Player = require("../../src/structures/bancho/Player");
const router = new Router().domain(/^c[e0-9]?(\.ppy\.sh)$/);

// exempt packets
const EXEMPT = [4];
const NO_LOG = [1];

// documentation:
// generic login response packet id is 5
// usual login response is a short

// main endpoint
router.handle("/", ["POST", "GET"], async (req, res) => {
    // handle browser requests very "dangerously"
    if (!req.headers["user-agent"] || req.headers["user-agent"] != "osu!") {
        // request from a browser
        let render = fs.readFileSync(__dirname + "/../../.data/home", "utf-8");
        let regex = /\{(.*)\}/g;
        let e = regex.exec(render);

        // read from home and parse data
        while (e !== null) {
            function danger() {
                return eval(`${e[1]}`)
            };

            render = render.replace(e[0], danger.call(glob))
            e = regex.exec(render);
        }

        return res.header("content-type", "text/html").send(render);
    };

    if (!req.headers["osu-token"]) { // login request
        let [resp, token] = await login(req.packets[0].toString(), req.headers["x-real-ip"]);

        res.header("cho-token", token); // write token
        return res.send(resp instanceof Buffer ? resp : Buffer.concat(resp)) // return packet(s)
    }

    // get player
    let player = glob.players.get(req.headers["osu-token"]);
    if (!player) { // most likely restarted server
        return res.send([
            glob.packets.notification("The server is restarting.\nPlease wait while it does!"),
            glob.packets.server_restart(0)
        ]);
    }

    // handle packets.
    let resp = [];
    let packets = parsePacket(req.packets[0]);

    for (let p of packets) {
        if (EXEMPT.includes(p.type)) {
            // do nothing lol
            continue;
        } else if (!Packets[p.type]) {
            console.log(`ERROR: A packet of type ${p.type} was left unhandled.\nData: ${p.data.toString()}`);
        } else {
            if (!NO_LOG.includes(p.type))
                console.log("A packet was handled successfully. (ID: " + p.type + ")")

            // construct handler
            let handler = new Packets[p.type](p);
            handler.run(req, resp, player); // then run it
        }
    }

    while (!player.empty()) {
        resp.push(player.dequeue());
    }

    player.last_recv_time = Date.now();

    return res.send(resp);
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
        if ((login_time - player.last_recv_time) > 10e3) {
            await player.logout(); // logout
        } else {
            return [[glob.packets.login(-1), glob.packets.notification("There is already a user logged in with this name.")], "0"]
        }
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

    // get scrypt cache
    let scrypt = glob.cache.store("scrypt");

    // compare passwords.
    let user = users[0];

    // efficient checking.
    if (scrypt.get(password_hash)) {
        if (!scrypt.get(password_hash).value == password_hash) {
            return [glob.packets.login(-1), "0"];
        }
    } else {
        if (!Hash.verify(password_hash, user.password_hash))
            return [glob.packets.login(-1), "0"];

        scrypt.set(password_hash, password_hash)
    }


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
        glob.packets.notification(`Welcome to osu!\nEnjoy your stay. (\´･ω･\`)\n\nServer Version: ${glob.config._internal.version}`),
        glob.packets.channels.end() // ???
    ];

    // setup player info and stats
    await plyr.get_stats();

    // join channels
    for (let channel of glob.channels) {
        // have to resend packet anyways, otherwise the client will try to join again.
        if (channel.auto_join && plyr.join(channel)) {
            resp.push(glob.packets.channels.join(channel.full_name))
        }

        resp.push(glob.packets.channels.info(channel))
    }

    let user_data = [glob.packets.players.presence(plyr), glob.packets.players.stats(plyr)];

    resp.push(user_data[0], user_data[1]);

    // enqueue players to us
    for (let p of glob.players.values()) {
        if (p.id !== 1) { // ignore orin lol
            p.enqueue(user_data)
        }

        // enqueue them to us
        resp.push(glob.packets.players.presence(p), glob.packets.players.stats(p));
    }

    // add player in
    glob.players.add(plyr);

    // okay
    plyr.login_time = login_time;
    return [resp, plyr.token];
}


function parsePacket(data) {
    var offset = 0;
    var packets = [];


    while (offset < data.length) {
        let id = parseInt(Buffer.from(data.slice(offset, offset + 2)).reverse().toString("hex"), 16);
        let length = parseInt(Buffer.from(data.slice(offset + 3, offset + 7)).reverse().toString("hex"), 16);

        let packet = new Packet(data.slice(offset, (offset + 7) + length));

        packets.push({
            type: id,
            data: packet,
            raw: data.slice(offset + 7, (offset + 7) + length)
        });

        offset += (offset + 7) + length;
    }


    return packets;
}

/*function parsePacket(packet) {
    var offset = 0;
    var packets = [];

    while (offset < packet.length) {
        packets.push({
            type: packet.readUInt16LE(offset),
            data: new Buffer.from(packet.slice(offset + 7, offset + packet.readUInt32LE(offset + 3) + 7)),
            //  raw: new Buffer.from(packet.slice(offset, offset + packet.readUInt32LE(offset + 3) + 7))
        });

        offset += packet.readUInt32LE(offset + 3);
    }

    return packets;
}*/
module.exports = router;