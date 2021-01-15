const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

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

                    let isThere = srv._routers.find(r => String(r._domain) === String(router._domain));
                    if (isThere) {
                        isThere.merge(router);
                    } else srv._routers.push(router);
                }
            }
        })(this, path.join(__dirname, "/../../routers"));

        // server
        this._server = http.createServer(async(req, res) => {
            await this._handle(req, res)
        })

        // listen
        this._server.listen(3821);
    }

    async _handle(req, res) {
        // handle qs
        let url = new URL(req.url, `https://${req.headers.host}`);
        req.path = url.pathname;

        // get router
        let router = this._routers.find((r) => {
            if (r._domain instanceof RegExp) {
                return r._domain.test(req.headers.host);
            } else return r._domain == req.headers.host;
        });

        if (!router) router = this._routers[0]; // _default

        let route = router.routes.find((r) => {
            if (r.path instanceof RegExp) {
                return r.path.test(req.path) && r.methods.includes(req.method);
            } else return r.path == req.path && r.methods.includes(req.method);
        });

        if (!route) {
            return res.end("Not Found.");
        }

        // hnadle requests
        let _req = new Request(req);
        let _res = new Response(res);

        // set data
        _req.query = url.searchParams;
        _req.querystring = url.search;

        let handled = false;
        req.on("data", async chunk => {
            _req.packets.push(chunk);

            // handle then send
            handled = true;
            _req._handle();
            route.callback(_req, _res);
        });

        setTimeout(() => {
            if (!handled)
                route.callback(_req, _res);
        }, 200);
    }
}

module.exports = HttpServer;