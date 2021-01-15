class Request {
    constructor(_req) {
        this._req = _req;

        this.path = _req.path;

        this.headers = _req.headers;

        this.packets = [];

        this.query = _req.query ? toObject(_req.query.entries()) : {};

        this.body = {};
    }

    validate(against, body = this.body) {
        let result = true;
        for (let key of against) {
            if (typeof body == "object") {
                if (body[key] == null) result = false;
            }
        }

        return result;
    }

    _handle() {
        if (this.headers["content-type"]) { // we have content!
            if (this.headers["content-type"].startsWith("multipart/form-data")) {
                // handle
                let data = this.packets.shift().toString();
                let data_regex = /(?:\r?\n)Content-Disposition: form-data; name="(.*)"(?:\r?\n)(?:\r?\n)(.*)(?:\r?\n)/g;
                let self;

                while (self = data_regex.exec(data)) {
                    this.body[self[1]] = self[2];
                }
            }
        }
    }
}

function toObject(usp) {
    let res = {};

    for (let [name, value] of usp) {
        // types
        if (/[^a-zA-Z]/.test(value)) { // number
            if (!isNaN(parseInt(value))) {// second verification
                res[name] = parseInt(value);
            } else res[name] = value;
        } else res[name] = value;
        
    }

    return res;
}

module.exports = Request;