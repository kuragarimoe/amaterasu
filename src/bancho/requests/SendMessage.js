const Packet = require("../Packet");

class SendMessage {
    constructor(p) {
        // handle packet
        this.message = readString(p.raw, 2);
        this.channel = readString(p.raw, 4 + this.message.length);
    }

    run(req, res, player) {
        // find the target
        let target = this.channel;
        if (target == "#spectator") {
            // ill do this when i get spectator shit done
        } else
            target = glob.channels.find(c => c.full_name == target);

        if (!target)
            return;

        target.send(this.message, player)
        return;
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

module.exports = SendMessage;