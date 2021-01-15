class PlayerMap extends Map {
    constructor() {
        super();
    }

    enqueue(packet) {
        for (let p of this.values())
            p.enqueue(packet);

        return this;
    }

    /**
     * Gets a player from the map.
     * @arg {Number} token The token of the player.
     * @returns {Player} The gotten player.
     */
    get(id) {
        return super.get(id);
    }

    /**
     * Adds a new player to the map.
     * @arg {Player} player The player to add.
     * @returns {Player} The added player.
     */
    add(player) {
        this.set(player.token || player.id, player);

        return player;
    }

    remove(player) {
        this.delete(player.token || player.id)

        return player;
    }

    /**
    * Return the first object to make the function evaluate true
    * @arg {Function} func A function that takes an object and returns true if it matches
    * @returns {Class?} The first matching object, or undefined if no match
    */
    find(func) {
        for (const item of this.values()) {
            if (func(item)) {
                return item;
            }
        }

        return null;
    }
}

module.exports = PlayerMap;