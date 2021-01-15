class Router {
    constructor() {
        this.routes = []
    }

    handle(path, methods = ["GET"], callback) {
        this.routes.push({
            path,
            methods,
            callback
        });

        return this;
    }

    domain(domain) {
        this._domain = domain;

        return this;
    }

    merge(router) {
        for (let route of router.routes) {
            this.routes.push(route)
        }

        return;
    }
}

module.exports = Router;