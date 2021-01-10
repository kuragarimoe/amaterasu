const toml = require("toml");
const fs = require("fs");
const mysql = require("mysql2/promise");
const PlayerMap = require("../src/structures/bancho/PlayerMap");

let mysql_cfg = toml.parse(fs.readFileSync(__dirname + "/../config/mysql.toml"));
let cfg = toml.parse(fs.readFileSync(__dirname + "/../config/config.toml"));

// set global space (we like glob. not global.)
global.glob = {};

// database
glob.config = cfg;
glob.db = mysql.createPool(mysql_cfg.database)

// lists and structures
glob.players = new PlayerMap();

// get a list of current roles
(async() => {
    let [roles, _] = await glob.db.execute("SELECT * FROM roles");

    glob.roles = roles;
})();

// bancho packets
glob.packets = {};

for (let file of fs.readdirSync(__dirname + "/../src/bancho/packets")) {
    glob.packets[file.slice(0, -3).toLowerCase()] = require(__dirname + "/../src/bancho/packets/" + file);
}
