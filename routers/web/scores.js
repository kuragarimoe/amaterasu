// Modules
const Router = require("../../src/http/Router");
const Beatmap = require("../../src/structures/Beatmap")

// Router
const router = new Router().domain("osu.katagiri.io");

/// ROUTES ///

router.handle("/web/osu-osz2-getscores.php", ["GET"], async (req, res) => {
    let beatmap_set_cache = glob.cache.store("beatmapsets");

    if (!req.validate(["s", "vv", "v", "c", "f", "m",
        "i", "mods", "h", "a", "us", "ha"], req.query)) {
        return res.status(400).send("");
    }

    // get the player whose sending the data
    let player = glob.players.get_login(req.query["us"], req.query["ha"]);
    if (!player)
        return res.status(400).send("");

    let map_md5 = req.query["c"];
    let set_id = parseInt(req.query["i"]);
    let map = await Beatmap.from_md5(map_md5, set_id);

    if (!map) {
        // map not found
        let map_exists = false;

        if (set_id > 0 && beatmap_set_cache.get(set_id) == null) {
            // mapset not found either
            return res.status(200).send("-1|false");
        } else if (set_id > 0) {
            let set = beatmap_set_cache.get(set_id)

            for (let map of set.beatmaps.values()) {
                if (map.filename == req.query["f"]) {
                    map_exists = true;
                    break;
                }
            }
        } else {
            // no set id, try filename?
            let map = (await glob.db.execute(`
                SELECT * from maps
                WHERE filename = ?
            `, [req.query["f"]]))[0][0];

            if (map) {
                map_exists = true;
            }
        }

        if (map_exists == true) {
            // player needs to update the map
            return "1|false";
        } else {
            // unsubmitted
            return "-1|false";
        }
    }

    // convert map status
    switch (map.status) {
        case -1: // pending
        case -2: // graveyard
            map.status = 0;
            break;
            
        case 1: // ranked
            map.status = 2;
            break;

        case 2: // approved
            map.status = 3;
            break;

        case 3: // qualified
            map.status = 4;
            break;
        case 4: // loved
            map.status = 5;
            break;

        default:
            map.status = -1;
            break;
    }

    // get scores
    let scores = (await glob.db.execute(`
        SELECT * from scores_vn
        WHERE map_md5 = ?
        ORDER BY score DESC LIMIT 50
    `, [map.md5]))[0];

    let resp = [];
    resp.push(`${map.status}|false|${map.id}|${map.set_id}|${scores.length}`); // map information

    // get map ratings
    let rating = (await glob.db.execute(`
        SELECT AVG(rating) AS average_rating FROM ratings
        WHERE map_md5 = ?
    `, [map.md5]))[0][0];

    if (!rating.average_rating) {
        rating = "10.0"
    } else {
        rating = ratings.average_rating;
    }

    resp.push(`0\n${map.artist} - ${map.title}\n${rating}`);

    if (scores.length == 0) {
        console.log(resp.join("\n") + "\n\n")
        return res.send(resp.join("\n") + "\n\n")
    }
});

module.exports = router;