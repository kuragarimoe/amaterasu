const http = require("http");
const fs = require("fs");
const path = require("path");
const Request = require("../structures/Request");
const Response = require("../structures/Response");

class HttpServer {
    constructor(client) {
        this.client = client;

        // preload routers 
        this._routers = [];
        (function head(srv, dir) {
            let files = fs.readdirSync(dir);

            for (let file of files) {
                let data = fs.lstatSync(path.join(dir, file));
                if (data.isDirectory()) {
                    head(srv, path.join(dir, file));
                } else {
                    let router = require(path.join(dir, file));
                    router._server = srv;

                    srv._routers.push(router);
                }
            }
        })(this, path.join(__dirname, "/../../routers"));

        // server
        this._server = http.createServer((req, res) => {
            this._handle(req, res)
        })

        // listen
        this._server.listen(3821);
    }

    _handle(req, res) {
        // get router
        let router = this._routers.find((r) => {
            if (r._domain instanceof RegExp) {
                return r._domain.test(req.headers.host);
            } else return r._domain == req.headers.host;
        });
        if (!router) router = this._routers[0]; // _default

        let route = router.routes.find((r) => {
            if (r.path instanceof RegExp) {
                return r.path.test(req.url) && r.methods.includes(req.method);
            } else return r.path == req.url && r.methods.includes(req.method);
        });

        if (!route) {
            return res.end("Not Found.");
        }
        let _req = new Request(req);
        let _res = new Response(res);

        req.on("data", chunk => {
            _req.packets.push(chunk);
            
            // handle then send
            _req._handle(); 
            route.callback(_req, _res)
        })

    }
}

module.exports = HttpServer;