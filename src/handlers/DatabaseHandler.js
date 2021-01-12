class DatabaseHandler {
    constructor(pool) {
        this._pool = pool;
    }

    async fetch(query, data) {
        let [res, _] = await this.execute(query, data);

        if (!res[0])
            return null;

        return res[0];
    }

    async execute(query, data) {
        return await this._pool.execute(query, data)
    }
}

module.exports = DatabaseHandler;