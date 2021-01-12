const toml = require("toml");
const fs = require("fs");
const mysql = require("mysql2/promise");
const PlayerMap = require("../src/structures/bancho/PlayerMap");
const Channel = require("../src/structures/bancho/Channel");
const DatabaseHandler = require("../src/handlers/DatabaseHandler");

let mysql_cfg = toml.parse(fs.readFileSync(__dirname + "/../config/mysql.toml"));
let cfg = toml.parse(fs.readFileSync(__dirname + "/../config/config.toml"));

// set global space (we like glob. not global.)
global.glob = {};

// database and config
glob.config = cfg;
glob.db = new DatabaseHandler(mysql.createPool(mysql_cfg.database));

// lists and structures
glob.players = new PlayerMap();

// get a list of current roles
(async() => {
    let [roles, _] = await glob.db.execute("SELECT * FROM roles");

    glob.roles = roles;
})();

// get channels
(async() => {
    let [channels, _] = await glob.db.execute("SELECT * FROM channels");

    glob.channels = channels.map(c => new Channel(c));
})();

// bancho packets
glob.packets = {};

for (let file of fs.readdirSync(__dirname + "/../src/bancho/packets")) {
    glob.packets[file.slice(0, -3).toLowerCase()] = require(__dirname + "/../src/bancho/packets/" + file);
}

// handled
glob.handled = [];