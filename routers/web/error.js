// Modules
const crypto = require('crypto');
const Router = require("../../src/http/Router");
const { Hash } = require('../../src/util/Util');
const Util = require('../../src/util/Util');

// Router
const router = new Router().domain("osu.ppy.sh");

// #POST [/users]
router.handle("/web/osu-error.php", ["POST"], async (req, res) => {
    console.log(`\nAN ERROR HAS OCCURED IN A CLIENT:\n${req.body.stacktrace}\n`)
    res.send("ok")
});

module.exports = router;