class Request {
    constructor(_req) {
        this._req = _req;

        this.path = _req.path;

        this.headers = _req.headers;

        this.packets = [];

        this.body = {};
    }

    validate(against) {
        let result = true;
        for (let key of against) {
            if (!this.body[key]) result = false;
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

module.exports = Request;