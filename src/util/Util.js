const crypto = require("crypto");
const bcrypt = require("bcrypt");

class Util {
    static toUnix(time) {
        return Math.floor(time / 1000)
    }

    static genToken() {
		const c = 'zyxwvutsrqponmlkjihgfedcba9876543210';
		var t = '', i = 32;
		while (i--) t += c[Math.random() * 35 | 0];// `| 0` is compact and faster alternative for `Math.floor()`
		return t;
    }
}

Util.Hash = class Hash {
    static md5(text) {
        return crypto.createHash("md5").update(text).digest("hex");
    }

    static salt(rounds = 10) {
        return bcrypt.genSaltSync(rounds);
    }

    static encrypt(text, salt = Hash.salt(10)) {
        return bcrypt.hashSync(text, salt);
    }

    static verify(text, hash) {
        return bcrypt.compareSync(text, hash);
    }
}

module.exports = Util;