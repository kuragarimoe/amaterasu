const Int64 = require("int64-buffer").Int64LE;
const UInt64 = require("int64-buffer").Uint64LE;
const { Type } = require("../src/util/Constants")

class Packet {
    constructor(id, data) {
        this.id = id || 0;
        this.data = data || [];
    }

    write(data, type) {
        this.data.push({
            type,
            data
        })
    }

    pack(id = this.id) {
        let offset = 7;

        // get the size of the overall packet
        let size = this.data.reduce((acc, current) => {
            return acc + getSize(current.type, current.data);
        }, 0);

        // create a packet with the gotten size
        let packet = Buffer.alloc(7 + size); // offset 7, as the first 7 bytes are packet headers.

        // write base data
        packet.writeInt16LE(id, 0); // packet id
        packet.writeInt8(0x00, 2); // empty placeholder for old data (unused)
        packet.writeInt32LE(size, 3); // data_size

        // write data, fuckily
        for (let p of this.data) {
            if (p.type == Type.String) {
                packString(p.data).copy(packet, offset);
            } else if (p.type == Type.Byte) {
                packet[offset] = p.data;
            } else if (p.type == Type.Int) {
                packet.writeInt32LE(p.data, offset);
            } else if (p.type == Type.UInt) {
                packet.writeUInt32LE(p.data, offset);
            } else if (p.type == Type.Short) {
                packet.writeInt16tLE(p.data, offset);
            } else if (p.type == Type.UShort) {
                packet.writeUInt16LE(p.data, offset);
            } else if (p.type == Type.Float) {
                packet.writeFloatLE(p.data, offset);
            } else if (p.type == Type.Long) {
                new Int64(p.data).toBuffer().copy(packet, offset);
            } else if (p.type == Type.ULong) {
                new UInt64(p.data).toBuffer().copy(packet, offset);
            } else if (p.type == Type.Raw) {
                new Buffer.from(p.data).copy(packet, offset);
            }

            // move offset
            offset += getSize(p.type, p.data);
        }

        return packet;
    }

    // template engine stolen from shiori (will attempt to rework later.)p
    static template(data, template = []) {
        let obj = {};
        let offset = 0;

        template.forEach(x => {
            let newdata = data.slice(offset);

            if (x.type === Type.ArrayOfValues) {
                x.template.forEach(template => {
                    !obj[x.parameter] && (obj[x.parameter] = []);
                    for (let i = 0; i < x.length; i++) {
                        !obj[x.parameter][i] && (obj[x.parameter][i] = {});
                        if (template.condition != undefined) {
                            obj[x.parameter][i][template.parameter] = template.condition(parse(newdata, template).data, obj, i) == false ? parse(newdata, template).data : null; // run condition then evaluate the contents.
                            offset += template.condition(parse(newdata, template).data, obj, i) == false ? parse(newdata, template).offset : 1;
                        } else {
                            obj[x.parameter][i][template.parameter] = parse(newdata, template).data;
                            offset += parse(newdata, template).offset;
                            newdata = data.slice(offset);
                        }
                    }
                });
                return;
            }

            if (x.condition == undefined) {
                obj[x.parameter] = parse(newdata, x).data;
                offset += parse(newdata, x).offset;
            } else {
                obj[x.parameter] = x.condition(parse(newdata, x).data, obj) == true ? parse(newdata, x).data : null; // run condition then evaluate the contents.
                offset += x.condition(parse(newdata, x).data, obj) == true ? parse(newdata, x).offset : 0;
            }
        });

        return obj;
    }
}

`function parse(value, p) {
    let offset = 0;
    let data = null;

    if (p.type == Type.String) {
        data = readString(value, 0);
        offset += data == null ? 1 : data.length + 2;
    } else if (p.type == Type.Byte) {
        data = value[offset];
        offset += 1;
    } else if (p.type == Type.Int) {
        data = value.readIntLE();
        offset += 4;
    } else if (p.type == Type.UInt) {
        data = value.readUIntLE();
        offset += 4;
    } else if (p.type == Type.Short) {
        data = value.readShortLE();
        offset += 2;
    } else if (p.type == Type.UShort) {
        data = value.readUShortLE();
        offset += 2;
    } else if (p.type == Type.Float) {
        data = value.readFloatLE();
        offset += 4;
    } else if (p.type == Type.Long) {
        data = new Long(value);
        offset += 8;
    } else if (p.type == Type.ULong) {
        data = new ULong(value);
        offset += 8;
    } else if (p.type == Type.Raw) {
        data = new Buffer.from(value);
        offset += data.length;
    }

    return { data, offset };
}`

function readString(packet, offset) {
    let p = packet.slice(offset);

    if (p[0] == 0x00) { // no string
        return null;
    } else if (p[0] == 0x0B) { // there is a string
        if (p[1] == 0x00) { // empty length
            return "";
        } else {
            return p.slice(2, 2 + p[1]).toString();
        }
    } else {
        return ReadString(packet, offset + 1);
    }
}

function getSize(type, data) {
    if (type == Type.String) {
        return packString(data).length;
    } else if (type == Type.Byte) {
        return 1;
    } else if (type == Type.Raw) {
        return data.length;
    } else if (type == Type.Int || type == Type.UInt) {
        return 4;
    } else if (type == Type.Short || type == Type.UShort) {
        return 2;
    } else if (type == Type.Float) {
        return 4;
    } else if (type == Type.Long || type == Type.ULong) {
        return 8;
    }

    return 0;
}

function encodeULEB128(num) {
    if (num == 0) return new Buffer.from(0x00);

    let arr = new Buffer.alloc(16);
    let length = 0;
    let offset = 0;

    while (num > 0) {
        arr[offset] = num & 127;
        offset += 1;
        num = num >> 7;
        num != 0 && (arr[length] = arr[length] | 128);
        length += 1;
    }

    return arr.slice(0, length);
}

function packString(str) {
    if (str == null || str == '') {
        return new Buffer.from([0x00]);
    } else {
        return new Buffer.concat([new Buffer.from([0x0B]),
        encodeULEB128(str.length),
        new Buffer.from(str)
        ]);
    }
}

module.exports = Packet;