class CacheStorage {
    constructor() {
        this.caches = new Map();

        this.current = "";

        // flush caches
        setInterval(() => {
            this.caches.forEach((cache) => cache.flush())
        }, 3e5); // 30 seconds
    }

    store(store) {
        let cache = this.caches.get(store);
        if (!cache) {
            cache = new Cache(store);
            this.caches.set(cache.name, cache);
        }

        return cache;
    }

    set(store, key, value, expiry = 0) {
        let cache = this.caches.get(store);
        if (!cache) {
            return this;
        }

        return this;
    }
}

class Cache {
    constructor(name) {
        this.name = name;

        this.pairs = new Map();
    }

    get(key) {
        return this.pairs.get(key);
    }

    set(key, value, expiry = 0) {
        this.pairs.set(key, {
            value,
            expiry
        });
    }

    /**
     * Flushes all the expired pairs in the cache.
     */
    flush() {
        this.pairs.forEach((pair) => {
            if (pair.expiry != 0 && pair.expiry < Date.now) {
                this.pairs.delete(pair.key);
            }
        });

        return this;
    }
}

module.exports = CacheStorage