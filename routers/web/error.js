// Modules
const crypto = require('crypto');
const Router = require("../../src/http/Router");
const { Hash } = require('../../src/util/Util');
const Util = require('../../src/util/Util');

// Router
const router = new Router().domain("osu.katagiri.io");

// #POST [/web/osu-error.php]
router.handle("/web/osu-error.php", ["POST"], async (req, res) => {
    console.log(`\nAN ERROR HAS OCCURED IN A CLIENT:\n${req.body.stacktrace}\n`)
    res.send(Buffer.alloc(0)) // send empty buffer
});

module.exports = router;