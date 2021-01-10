class PlayerMap extends Map {
    constructor() {
        super();
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