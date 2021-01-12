const PlayerMap = require("./PlayerMap");

class Channel { 
    constructor(data) {
        this.name = data.name;

        this.description = data.description;

        this.auto_join = data.auto_join;

        this.players = new PlayerMap();
    }

    enqueue(packet) {
        for (let player in this.players.values()) {
            player.enqueue(packet);
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
        this.enqueue(glob.packets.players.send(sender, message, this))

        return this;
    }

    get full_name() {
        return "#" + this.name;
    }
}

module.exports = Channel;