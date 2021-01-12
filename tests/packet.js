const { Uint64LE } = require("int64-buffer");
const Packet = require("../src/bancho/Packet");
const NanoTimer = require('nanotimer');
const timerA = new NanoTimer();
const timerB = new NanoTimer();
const { Type } = require("../src/util/Constants");

const notif = require("../src/bancho/packets/notification")
let example = notif("Hello, world!");

/// TIMERS ///

console.log("PACKET READ TEST");
let readTime = timerA.time(read, '', 'm');
console.log("\nRead Time: " + readTime + "ms");

console.log("\nPACKET WRITE TEST");
let writeTime = timerB.time(write, '', 'm');
console.log("\nWrite Time: " + writeTime + "ms");

/// READ ///

function read() {
    // create the packet, ID AND ALL
    let packet = new Packet(example);

    // this is a type 24 buffer, so its a notification; read string
    let string = packet.read(Type.String);

    // done
    console.log("Read String:", string)
    console.log("Memory Usage: " + (Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100) + "MB");
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

    // done
    console.log("Example Buffer:", example)
    console.log("Packet:        ", create.toString());
    console.log("Created Buffer:", packed);
    console.log("Memory Usage: " + (Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100) + "MB");
}