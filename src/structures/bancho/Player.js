const Packet = require("../../bancho/Packet");
const { Permissions, ClientPermissions } = require("../../util/Constants");
const Util = require("../../util/Util");

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
        }

        // metadata
        this._packets = [];
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
}

module.exports = Player;