/**
 * A collection of things, or values assigned to keys.
 * @extends {Map}
 */
 class Collection extends Map {
    /**
     * @param {Iterable} iterable A class to have items be set as in order to be accepted.
     */
    constructor(iterable) {
        super();

        /**
         * An item that can be iterated upon, and be used as a filter for unwanted objects.
         * @type {Iterable}
         */
        this.iterable = iterable;
    }

    /**
     * Add a new item to the collection.
     * @param {Iterable} obj The object/item to add.
     * @returns {Iterable} Returns the newly added object.
     */
    add(obj) {
        if (!obj.id) throw new Error("This object does not have an ID.");

        if (this.iterable && !(obj instanceof this.iterable))
            throw new TypeError("This type is not the same as the iterable set to this collection.");

        if (this.get(obj.id)) return this.get(obj.id);

        this.set(obj.id, obj);
        return obj;
    }

    set(id, obj) {
        if (this.iterable && !obj instanceof this.iterable)
            throw new TypeError("This type is not the same as the iterable set to this collection.");
        
        super.set(id, obj)
    }

    /**
     * Finds an item in the collection by function.
     * @param {Function} fn 
     * @returns {?Iterable} Returns the found item.
     */
    find(fn) {
        for (let item of this.values()) {
            if (fn(item, item.id)) return item;
        }

        return null;
    }

    /**
     * Filters the collection by a function to get items.
     * @param {Function} fn 
     * @returns {Array<?Iterable>} Returns the filtered items.
     */
    filter(fn) {
        let arr = [];

        for (let value of this.values()) {
            if (fn(value, value.id)) arr.push(value);
        }

        return arr;
    }

    /**
     * Returns the first item in the collection.
     * @returns {?Object} Returns the found item.
     */
    first() {
        return this.values().next().value;
    }

    /**
     * Removes an object from the collection.
     * @param {number|Object} item The item, whether by its ID or the object itself.
     */
    remove(item) {
        if (item instanceof Object) return this.remove(item.id);

        if (!this.get(item)) return null;

        this.delete(item);
        return item;
    }

    /**
     * Returns the collection as an object.
     * @returns {Iterable} The object resulting from the collection.
     */
    toJSON() {
        const json = {};

        this.values().forEach((item) => json[item.id] = item);

        return json;
    }
}

module.exports = Collection;