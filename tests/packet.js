const Packet = require("../src/bancho/Packet");
const { Type } = require("../src/util/Constants");

const notif = require("../src/bancho/packets/notification")
let example = notif("Hello, world!");

console.log(example)

/// TIMERS ///
let readTotal = 0n;
let writeTotal = 0n;
let iterations = 100n;


console.log("PACKET READ TEST");
for (let i = 0; i < iterations; i++) {
    let start = process.hrtime.bigint();
    read();
    readTotal += process.hrtime.bigint() - start;

    if (i == 1) {
        console.log("\nFirst Read Time: " + (process.hrtime.bigint() - start) + "ns");
    }
}
console.log("Read Time Average: " + (readTotal / iterations) + "ns; " + `${iterations} iterations`);

console.log("\nPACKET WRITE TEST");
for (let i = 0; i < iterations; i++) {
    let start = process.hrtime.bigint();
    write();
    writeTotal += process.hrtime.bigint() - start;

    if (i == 1) {
        console.log("\nFirst Write Time: " + (process.hrtime.bigint() - start) + "ns");
    }
}
console.log("Write Time Average: " + (writeTotal / iterations) + "ns; " + `${iterations} iterations`);

/// READ ///

function read() {
    // create the packet, ID AND ALL
    let packet = new Packet(example);

    // this is a type 24 buffer, so its a notification; read string
    let string = packet.read(Type.String);
}

/// WRITE ///

function write() {
    // create basic packet
    let create = new Packet();

    // assign id 24 (notification)
    create.id(24);

    // write to packet
    create.write("Hello, world!", Type.String);

    // pack
    let packed = create.pack();
}