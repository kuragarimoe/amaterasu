const Packet = require("../../bancho/Packet");
const { Permissions, ClientPermissions, Mods } = require("../../util/Constants");
const Util = require("../../util/Util");
const RoleMap = require("./RoleMap");

const Systems = [
    "vn",
    "rx",
    "ap"
];

const Modes = [
    "std",
    "taiko",
    "ctb",
    "mania"
]

const Action = {
    Idle: 0,
    Afk: 1
}

/**
 * A player on the Amaterasu bancho server.
 */
class Player {
    constructor(data, extra) {
        /// PLAYER DATA ///

        /**
         * The ID of the player
         * @type {number}
         */
        this.id = data.id;

        /**
         * The username of the player
         * @type {string}
         */
        this.name = data.username;

        /**
         * A safer form of the username (with underscores)
         * @type {string}
         */
        this.safe_name = data.safe_username;

        // theres extra data, we gotta do stuff with it.
        if (extra) {
            // generate a token to send to the client

            /**
             * The session token belonging to the player.
             * @type {string?}
             */
            this.token = Util.genToken();

            /**
             * The osu! version the player is on.
             * @type {string?}
             */
            this.version = extra[0];

            

            this.utc_offset = parseInt(extra[1]);
        }
        

        /// META DATA ///

        /**
         * Whether or not the player is on a developer client or not.
         * @type {boolean}
         */
        this.developer = this.version?.includes("dev") || false;

        /**
         * The roles belonging to the user.
         * @type {RoleMap}
         */
        this.roles = typeof data.roles == "string" ? new RoleMap(data.roles.split(",")) : data.roles;

        /**
         * Whether or not this user is a bot.
         * @type {boolean}
         */
        this.bot = this.roles.get("3") ? true : false;

        /**
         * The channels the user is currently in.
         * @type {Array<Channel>}
         */
        this.channels = [];

        /**
         * The user's stats for every mode and given system.
         * @type {Object}
         * @private
         */
        this._stats = {};

        /**
         * The latitude and longitude of the player.
         * @type {Array<Number>}
         */
        this.location = [0.00, 0.00];

        /**
         * The status of the player.
         * @type {Status}
         */
        this.status = {
            action: Action.Idle,
            info: "",
            mods: Mods.NoMod,
            mode: 0,
            system: 0,
            map: {
                id: 0,
                md5: ""
            }
        };

        /**
         * The time the user logged in.
         * @type {Number}
         */
        this.login_time = 0;

        /**
         * The time a packet was last recieved from the user.
         * @type {Number}
         */
        this.last_recv_time = 0;

        /// PACKETS ///

        /**
         * Enqueued packets.
         * @type {Array<Buffer>}
         * @private
         */
        this._packets = [];
    }


    /// REQUESTS ///
    send(message, player) {
        // send a player to self
        this.enqueue(glob.packets.players.send(player, message, this))
    }

    /**
     * Returns the current statistics of the mode the user is playing on, or for a specified mode.
     * @param {Mode} [mode=0] The mode.
     * @param {Systen} [system=0] The system
     * @returns {Object|null} The returned statistics, if any.
     */
    stats(mode = Modes[this.status.mode], system = Systems[this.status.system]) {
        return this._stats[system][mode];
    }

    /**
     * Joins a channel.
     * @param {Channel} channel The channel to join.
     * @returns {boolean} Whether or not the player successfully joined or not.
     */
    join(channel) {
        if (channel.players.get(this.token))
            return false;

        // join channel
        channel.add(this);
        this.channels.push(channel);

        // enqueue join packet
        this.enqueue(glob.packets.channels.join(channel.full_name));

        return true;
    }

    /**
     * Leaves a channel.
     * @param {Channel} channel The channel to leave
     * @returns {boolean} Whether or not the player successfully left or not.
     */
    leave(channel) {
        if (!channel.players.get(this.token))
            return false;

        // leave channel
        channel.remove(this);
        this.channels = this.channels.filter(c => c.name == channel.name);

        // enqueue leave packet
        this.enqueue(glob.packets.channels.leave(channel.full_name));

        return true;
    }

    /**
     * Logs the player out of the server.
     */
    logout() {
        // remove player from global, and queue logout.
        glob.players.remove(this);

        // invalidate the token
        this.token = "";

        // leave all channels
        for (let channel of this.channels)
            this.leave(channel);

        this.enqueue(glob.packets.players.logout(this.id));
    }

    /// BANCHO DATA ///
    bancho_privileges() {
        let priv = 0;

        if (!this.roles.has(Permissions.Banned)) { // the user is not banned.
            priv |= ClientPermissions.Player

            // the server owner has the permission to disable free supporter for everyone
            // and to limit to a paywall.
            // i debated this option, but it makes sense to have in the long run.
            if (glob.config.general["free_supporter"]) {
                priv |= ClientPermissions.Supporter
            }
        }

        return priv;
    }

    /// PACKET HANDLING ///
    
    get online() {
        // return online whether the player has a token listed or the last ping was within 10 seconds
        return this.token != "" || (Date.now() - this.last_recv_time) < 10e3;
    }

    /**
     * Returns whether or not the packet queue is empty or not.
     */
    empty() {
        return this._packets.length == 0;
    }

    /**
     * Enqueues a packet to send to the player.
     * @param {Array<Packet>|Packet|Buffer} packet The packet(s) to send.
     */
    enqueue(packet) {
        if (this.bot) // dont enqueue to bots :)
            return this;
            
        if (Array.isArray(packet)) {
            for (let p of packet) {
                this.enqueue(p);
            }

            return;
        } else if (packet instanceof Packet) {
            packet = packet.pack();
        }

        // push packet
        this._packets.push(packet);

        return this;
    }

    /**
     * Dequeues a queued packet to send over.
     * @returns {Buffer} The finalized packet.
     */
    dequeue() {
        if (this.empty())
            return null;

        return this._packets.shift();
    }

    // CORE FUNCTIONS ///

    /**
     * Gets the statistics for the player from the database and properly assigns them.
     */
    async get_stats() {
        for (let system of Systems) {
            // setup system
            this._stats[system] = {};

            // get all modes
            for (let mode of Modes) {
                let data = await glob.db.fetch(`
                    SELECT
                        ranked_score_${mode} as rscore,
                        playcount_${mode} as plays,
                        ranked_score_${mode} as tscore,
                        avg_accuracy_${mode} as acc,
                        pp_${mode} as pp
                    FROM userstats_${system}
                    WHERE id = ?
                `, [this.id]);
                
                // set data
                this._stats[system][mode] = data;
            }
        }
    }

    /**
     * Retrieves all the friends the user has from the database.
     */
    async get_friends() {

    }
}

/// TYPEDEFS ///

/**
 * The status of the user, what they're doing, what map they're playing and more.
 * @typedef {object} Status
 * @prop {Action} [action=0] The thing the user is doing.
 * @prop {string} [info=""] A message that specifies what that user is doing.
 * @prop {Number} [mods=0] The mods the user is playing with.
 * @prop {Mode} [mode=0] The mode the user is playing on
 * @prop {System} [system=0] The system the user is playing on
 */

/**
 * The current thing the user is doing right now.
 * @typedef {number} Action
 * * `0`: The user is idling.
 * * `1`: The user is currently AFK.
 */

/**
 * The mode a user can play on.
 * @typedef {string|number} Mode
 * * `0`: osu!standard
 * * `1`: osu!taiko
 * * `2`: osu!catch
 * * `3`: osu!mania
 */

/**
 * The scoring system the user is currently playing with
 * @typedef {string|number} System
 * * `0`: Vanilla
 * * `1`: Relax
 * * `2`: Autopilot
 */

module.exports = Player;