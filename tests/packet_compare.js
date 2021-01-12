const NPacket = require("../src/bancho/Packet");
const { Type } = require("../src/util/Constants");
const OPacket = require("../unused/OldPacket");

let current = new NPacket().id(24);

let test = new OPacket(24);

test.write("Test", Type.String);

current.write("Test", Type.String)

console.log(current.pack())
console.log(test.pack())