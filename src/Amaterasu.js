const HttpServer = require("./http/HttpServer");

class Amaterasu {
    constructor() {
        /// ASSIGN SERVERS ///
        this.http = new HttpServer(this);
    }
}

// construct client
global.self = new Amaterasu;

module.exports = self;