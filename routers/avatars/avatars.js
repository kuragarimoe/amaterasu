// Modules
const  Router = require("../../src/http/Router");

// Router
const router = new Router().domain("a.ppy.sh");

router.handle("/:id", ["POST"], async (req, res) => {

    // send okay
    res.send("ok");
});

module.exports = router;