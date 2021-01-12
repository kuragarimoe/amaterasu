const Packet = require("../Packet");

class Logout {
    constructor(data) {
        // nothing to handle
    }

    run(req, resp, player) {
        player.logout();
        return
    }
}

function readString(packet, offset) {
	var p = packet.slice(offset);
	
	if(p[0] == 0x00) {
		return null;
	}

	if(p[0] == 0x0B) {
		if(p[1] == 0x00) {
			return "";
		} else {
			return p.slice(2, 2 + p[1]).toString();
		}
	} else {
		return ReadString(packet, offset + 1);
	}
}

module.exports = Logout ;