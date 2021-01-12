const Int64 = require("int64-buffer").Int64LE;
const UInt64 = require("int64-buffer").Uint64LE;
const { Type } = require("../util/Constants");

class Packet {
    constructor(buffer = "") {
        this.buffer = Buffer.from(buffer);

        this.offset = 0;

        // read the ID from the given buffer, if any
        if (buffer) {
            this._id = parseInt(this.buffer.slice(0, 2).reverse().toString("hex"), 16); // first 2 bytes is the ID
            this.buffer = buffer.slice(7); // create a buffer from the rest of the buffer
        }
    }

    get length() {
        return this.buffer.length;
    }

    /**
     * Sets the ID of the packet.
     * @param {Number} id The ID of the packet toset.
     */
    id(id) {
        if (!id) return this._id;

        this._id = id;
        return this;
    }

    write(data, type) {
        if (!typeof type == "number") { // is not a number
            if (!Type[type])
                throw new RangeError("The given type is not a very valid type.");

            type = Type[type];
        }

        let resp = null;
        let size = getSize(type, data);

        // special case for strings
        if (type == Type.String) {
            if (data == null || data == "") {
                resp = Buffer.from([0]);
            } else {
                let data_buffer = Buffer.from(data, "utf-8"); // data to a utf8 buffer
                let buffer = Buffer.alloc(1); // make the base of the uffer
                buffer.writeUInt8(0x0B, 0); // write base byte

                // length buffer
                let length = Buffer.from(writeULEB128(data_buffer.length));

                resp = Buffer.concat([buffer, length, data_buffer]);
            }
        } else {
            // everything else
            let buffer = Buffer.alloc(size);

            if (type == Type.Float) { // float
                buffer.writeFloatLE(data, 0, size);
            } else if (type == Type.ULong || type == Type.Long) { // ulong/long
                if (type == Type.Long) {
                    new Int64(data).toBuffer().copy(buffer, 0);
                } else {
                    new UInt64(data).toBuffer().copy(buffer, 0);
                }
            } else if (type == Type.UInt || type == Type.UShort) { // unsigned
                buffer.writeUIntLE(data, 0, size);
            } else if (type == Type.Raw) {
                new Buffer.from(data).copy(buffer, this.offset);
            } else { // signed
                buffer.writeIntLE(data, 0, size);
            }

            resp = buffer;
        }

        this.offset += resp.length + 1;
        this.buffer = Buffer.concat([this.buffer, resp]);
        return this;
    }

    /**
     * Read a specific given byte type.
     * @param {Number|Type} type The type to read, or the size to read.
     */
    read(type) {
        if (!typeof type == "number") { // is not a number
            if (!Type[type])
                throw new RangeError("The given type is not a very valid type.");

            type = Type[type];
        }

        let data = null;

        // special case for strings
        if (type == Type.String) {
            if (this.buffer[this.offset] == 0x0B) { // string
                // get the length of the string
                let length = readULEB128(this.buffer.slice(this.offset += 1));

                // return the data
                data = this.buffer.slice(this.offset += length.length, this.offset + length.value).toString();
                
                this.offset += length.value;
            } else { // no string
                this.offset++;
                data = null;
            }
        } else { // everything else
            if (type == Type.Raw) {
                data = this.buffer;
            } else {
                let byte_size = getSize(type);
                data = parseInt(this.buffer.slice(this.offset, this.offset += byte_size).reverse().toString("hex"), 16);
            }
        }
        return data;
    }

    pack(_id = this.id()) {
        let startBuffer = Buffer.alloc(7);

        // write length and id to start buffer
        startBuffer.writeInt16LE(_id, 0); // packet id
        startBuffer.writeInt32LE(this.length, 3);

        // return full buffer
        glob.handled.push({ id: _id })
        return Buffer.concat([startBuffer, this.buffer]);
    }

    toString() {
        let values = [];
        for (let value of this.pack().values()) {
            values.push(value.toString(16).padStart(2, "0"))
        }

        return `<Packet ${values.join(" ")}>`
    }

    static template(data, template = []) {
        let resp = {};
        let packet = new Packet(data);

        for (let templ of template) {
            resp[templ.key] = data.read()
        }
    }
}

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

function getSize(type, data) {
    if (type == Type.Byte) {
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

module.exports = Packet;