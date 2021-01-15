const PlayerMap = require("./PlayerMap");

class Channel { 
    constructor(data) {
        this.name = data.name;

        this.description = data.description;

        this.auto_join = data.auto_join;

        this.players = new PlayerMap();
    }

    get full_name() {
        return "#" + this.name;
    }
    
    enqueue(packet, sender) {
        for (let player of this.players.values()) {
            if (sender) {
                if (sender.name == player.name) {} // don't send to self
                else player.enqueue(packet);
            } else player.enqueue(packet);
        }

        return this;
    }

    add(player) {
        this.players.set(player.token, player);

        return this;
    }

    remove(player) {
        if (this.players.get(player.token || player)) {
            this.players.remove(player.token);
        }

        return this;
    }

    send(message, sender) {
        this.enqueue(glob.packets.players.send(sender, message, { name: this.full_name }), sender)

        return this;
    }
}

module.exports = Channel;