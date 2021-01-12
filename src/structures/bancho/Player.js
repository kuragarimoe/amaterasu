const Packet = require("../../bancho/Packet");
const { Permissions, ClientPermissions, Mods } = require("../../util/Constants");
const Util = require("../../util/Util");

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
    Afk: 0
}

class Player {
    constructor(data, extra) {
        // set basic player data.
        this.id = data.id;

        this.safe_username = data.safe_username;

        this.roles = data.roles;

        // theres extra data, we gotta do stuff with it.
        if (extra) {
            // generate a token to send to the client
            this.token = Util.genToken();

            this.version = extra[0];

            this.utc_offset = parseInt(extra[1]);
        }

        // metadata
        this.channels = [];

        this._stats = {};
        
        this.status = {
            action: Action.Idle,
            info: "",
            mods: Mods.NoMod,
            mode: 0,
            map: {
                id: 0,
                md5: ""
            }
        };

        /// PACKETS ///
        this._packets = [];
    }


    /// REQUESTS ///
    send(message, channel) {
        this.enqueue()
    }
    stats(mode = Modes[this.status.mode], system = "vn") {
        return this._stats[system][mode];
    }

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

    logout() {
        // invalidate the token
        this.token = "";

        // leave all channels
        for (let channel of this.channels)
            this.leave(channel);

        // remove player from global, and queue logout.
        glob.players.delete(this.token);
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
    empty() {
        return this._packets.length == 0;
    }

    enqueue(packet) {
        if (packet instanceof Packet)
            packet = packet.pack();

        // push packet
        this._packets.push(packet);
    }

    dequeue() {
        if (this.empty())
            return null;

        return this._packets.shift();
    }

    // CORE FUNCTIONS ///
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
}

module.exports = Player;