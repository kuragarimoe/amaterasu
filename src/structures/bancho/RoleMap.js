class RoleMap {
    constructor(roles) {
        // filter
        this.roles = glob.roles.filter((r) => roles.includes(r.id.toString()))
    }

    /**
     * Compares a privilege against all the roles in this list.
     */
    has(priv) {
        return this.roles.filter((r) => (r.permissions & priv) !== 0).length !== 0;
    }
}

module.exports = RoleMap;