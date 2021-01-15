const HttpServer = require("./http/HttpServer");
const Player = require("./structures/bancho/Player");

class Amaterasu {
    constructor() {
        /// ASSIGN SERVERS ///
        this.http = new HttpServer(this);

        /// BOT ///
        glob.db.fetch("SELECT * FROM users WHERE 1").then((p) => {
            glob.bot = new Player(p);
            glob.players.add(glob.bot);
        })
    }
}

// construct client
global.self = new Amaterasu;

module.exports = self;