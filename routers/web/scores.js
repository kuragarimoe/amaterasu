// Modules
const Router = require("../../src/http/Router");

// Router
const router = new Router().domain("osu.ppy.sh");

/// ROUTES ///

router.handle("/web/osu-osz2-getscores.php", ["GET"], async(req, res) => {
    if (!req.validate(["s", "vv", "v", "c", "f", "m",
        "i", "mods", "h", "a", "us", "ha"], req.query)) {
        return res.status(400).send("");
    }
    
    // get the player whose sending the data
    let p = glob.players.get_login(req.query["us"], req.query["ha"]);
    if (!p)
        return res.status(400).send("");

});

module.exports = router;