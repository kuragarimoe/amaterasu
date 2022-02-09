// Modules
const Router = require("../../src/http/Router");
const mime = require('mime/lite');
const fs = require("fs");

// Router
const router = new Router().domain("a.katagiri.io");

router.handle(/\/[a-zA-Z0-9](?:.*)?/, ["GET"], async (req, res) => {
    let path = /\/([a-zA-Z0-9])(?:.*)?/.exec(req.path);
    
    let possible_types = ["jpg", "jpeg", "png", "gif"];
    let filepath = null;
    let ext = null;

    for (let type of possible_types) {
        if (fs.existsSync(__dirname + "/../../.data/avatars/" + `${path[1]}.${type}`)) {
            filepath = __dirname + "/../../.data/avatars/" + `${path[1]}.${type}`
            ext = type;
        }
    }

    if (!filepath) {
        res.status(200).serve(fs.readFileSync(__dirname + "/../../.data/avatars/default.png"), mime.getType("png"));
    } else {
        let file = fs.readFileSync(filepath);
        let type = mime.getType(ext);
        res.status(200).serve(fs.readFileSync(filepath), type)
    }
});

module.exports = router;