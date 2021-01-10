const Packet = require("../bancho/Packet");

class Response {
    constructor(_res) {
        this._res = _res;

        this.status_code = 200;
        this.packet = new Packet() // just incase;
    }

    /// CORE HTTP FUNCTIONS ///

    status(code) {
        this.status_code = code;
        return this;
    };

    header(key, value) {
        this._res.setHeader(key, value);
        return this;
    }

    send(msg) {
        this._res.writeHead(this.status_code).end(msg);
    }

    /// CORE BANCHO FUNCTIONS ///

    write(data, type) {
        this.packet.write(data, type);
        return this;
    }

    pack(id) {
        return this.send(this.packet.pack(id));
    }
}

module.exports = Response;