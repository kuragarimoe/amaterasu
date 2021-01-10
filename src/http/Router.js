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
}

module.exports = Router;