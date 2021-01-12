const Packet = require("../src/bancho/Packet");
const { Type } = require("../src/util/Constants");

// create a useless packet we wont use
let packet = new Packet();

// create a string
let string = "";
for (let i = 0; i < (1 << 22); i++) {
    string += "a";
}

// write a string
packet.write(string, Type.String);
packet.write(string, Type.String);

console.log(packet.buffer)

// read the string
packet.offset = 0;

console.log("read 1")
console.log(packet.read(Type.String).length)
console.log("read 2")
console.log(packet.read(Type.String).length);

function readULEB128(arr) {
    var total = 0;
    var shift = 0;
    var len = 0;

    while (true) {
        var byte = arr[len];
        len++;
        total |= ((byte & 0x7F) << shift);
        if ((byte & 0x80) === 0) break;
        shift += 7;
    }

    return {
        value: total,
        length: len
    };
}

function writeULEB128(num) {
    var arr = [];
    var len = 0;

    if (num === 0)
        return [0];

    while (num > 0) {
        arr[len] = num & 0x7F;
        if (num >>= 7) arr[len] |= 0x80;
        len++;
    }

    return Buffer.from(arr);
}