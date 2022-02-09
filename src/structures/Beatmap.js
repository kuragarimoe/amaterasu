const fetch = require("node-fetch");
const Collection = require("../util/Collection");

class Beatmap {
    constructor(map) {
        console.log(map.md5)
        this.id = map.id;
        this.set_id = map.set_id;
        this.status = map.status;
        this.md5 = map.md5;
        this.artist = map.artist;
        this.title = map.title;
        this.version = map.version;
        this.creator = map.creator;
        this.filename = map.filename;
        this.last_update = map.last_update;
        this.total_length = map.total_length;
        this.max_combo = map.max_combo;
        this.frozen = map.frozen;
        this.plays = map.plays;
        this.passes = map.passes;
        this.mode = map.mode;
        this.bpm = map.bpm;
        this.cs = map.cs;
        this.ar = map.ar;
        this.od = map.od;
        this.hp = map.hp;
        this.stars = map.stars
    }

    static async from_md5(md5, set_id = -1) {
        let beatmap_md5_cache = glob.cache.store("beatmaps_md5");
        let map = beatmap_md5_cache.get(md5);

        if (!map) {
            if (set_id <= 0) {
                // no mapset id maybe we can find it
                let map = await glob.db.execute(`
                    SELECT set_id FROM maps
                    WHERE md5 = ?
                `, [md5])[0];

                if (!map) {
                    // no set id
                    // attempt to get it via api
                    let response = await fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${glob.config.general.osu_api}&h=${md5}`);
                    let obj = await response.json();

                    if (obj.error || !obj[0])
                        return null;


                    set_id = map[0].beatmapset_id;
                } else {
                    // set id
                    set_id = map.set_id;
                }
            }

            // get entire set if possible
            let set = await BeatmapSet.from_setid(set_id)

            if (!set)
                return null;

            // map cached now
            map = beatmap_md5_cache.get(md5);

            if (!map)
                return null;
        }

        return map;
    }
}

// has to be here aswell  or js will kill itself
class BeatmapSet {
    constructor(set) {
        this.id = set.id;

        this.last_api_check = set.last_api_check;

        this.beatmaps = new Collection();
    }

    static async from_setid(set_id) {
        let beatmap_md5_cache = glob.cache.store("beatmaps_md5");
        let beatmap_set_cache = glob.cache.store("beatmapsets");
        let set = beatmap_set_cache.get(set_id);
        let api_req = false;

        if (!set) {
            // check mysql
            set = (await glob.db.execute(`
                SELECT * from mapsets
                WHERE id = ?
            `, [set_id]))[0][0];

            if (!set) {
                // check api
                let response = await fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${glob.config.general.osu_api}&s=${set_id}`);
                let obj = await response.json();

                if (obj.error || !obj[0]) {
                    return null;
                } else {
                    set = new BeatmapSet({
                        id: parseInt(obj[0].beatmapset_id),
                        last_api_check: Date.now()
                    });

                    for (let map of obj) {
                        // add all maps to db
                        await glob.db.execute(`
                            REPLACE INTO maps
                            ( server, id, set_id, status, md5, artist,
                              title, version, creator, filename, last_update,
                              total_length, max_combo, frozen, plays, passes,
                              mode, bpm, cs, ar, od, hp,stars
                            ) VALUES ( "osu!", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
                        `, [
                            map.beatmap_id,
                            set.id,
                            map.approved,
                            map.file_md5,
                            map.artist,
                            map.title,
                            map.version,
                            map.creator,
                            `${map.artist} - ${map.title} (${map.creator}) [${map.version}].osu`,
                            new Date(Date.parse(map.last_update)),
                            map.total_length,
                            map.max_combo,
                            false,
                            0,
                            0,
                            map.mode,
                            map.bpm,
                            map.diff_size,
                            map.diff_approach,
                            map.diff_overall,
                            map.diff_drain,
                            map.difficultyrating
                        ]);

                        // get map
                        let beatmap = (await glob.db.execute(`
                        SELECT * from maps
                        WHERE id = ?
                    `, [map.beatmap_id]))[0][0];

                        map = new Beatmap(beatmap);
                        beatmap_md5_cache.set(map.md5, map, Date.now() + 3.6e+6);
                        set.beatmaps.set(map.id, map);
                    }

                    // save to db
                    await glob.db.execute(`
                        REPLACE INTO mapsets
                        ( server, id, last_api_check )
                        VALUES ( "osu!", ?, ? )
                    `, [set.id, Date.now()]);

                    api_req = true;
                }
            } else {
                set = new BeatmapSet(set);

                // get maps
                let beatmaps = (await glob.db.execute(`
                        SELECT * from maps
                        WHERE set_id = ?
                    `, [set.id]))[0];

                for (let map of beatmaps) {
                    set.beatmaps.set(map.id, new Beatmap(map));
                }
            }
        } else {
            let beatmaps = (await glob.db.execute(`
                    SELECT * from maps
                    WHERE set_id = ?
                `, [set.id]))[0];

            for (let map of beatmaps) {
                set.beatmaps.set(map.id, new Beatmap(map));
            }
        }

        if (api_req == false) {
            if ((set.last_api_check + 3.6e+6) <= Date.now()) {
                // update cache
                let response = await fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${glob.config.general.osu_api}&s=${set_id}`);
                let obj = await response.json();

                if (obj.error) {
                    return null;
                } else {
                    set = new BeatmapSet({
                        id: parseInt(obj[0].beatmapset_id),
                        last_api_check: Date.now()
                    });

                    for (let map of obj) {
                        await glob.db.execute(`
                            REPLACE INTO maps
                            ( server, id, set_id, status, md5, artist,
                              title, version, creator, filename, last_update,
                              total_length, max_combo, frozen, plays, passes,
                              mode, bpm, cs, ar, od, hp, stars
                            ) VALUES ( "osu!", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
                        `, [
                            map.beatmap_id,
                            set.id,
                            map.approved,
                            map.file_md5,
                            map.artist,
                            map.title,
                            map.version,
                            map.creator,
                            `${map.artist} - ${map.title} (${map.creator}) [${map.version}].osu`,
                            new Date(Date.parse(map.last_update)),
                            map.total_length,
                            map.max_combo,
                            false,
                            0,
                            0,
                            map.mode,
                            map.bpm,
                            map.diff_size,
                            map.diff_approach,
                            map.diff_overall,
                            map.diff_drain,
                            map.difficultyrating
                        ]);

                        // get map
                        let beatmap = (await glob.db.execute(`
                            SELECT * from maps
                            WHERE id = ?
                        `, [map.beatmap_id]))[0][0];

                        map = new Beatmap(beatmap);
                        beatmap_md5_cache.set(map.md5, map, Date.now() + 3.6e+6);
                        set.beatmaps.set(map.id, map);
                    }
                }

                await glob.db.execute(`UPDATE \`mapsets\` SET last_api_check = ?`, [set.last_api_check]);
            }

            beatmap_set_cache.set(set.id, set, Date.now() + 3.6e+6);
        }

        for (let map of set.beatmaps.values()) {
            if (!beatmap_md5_cache.get(map.md5)) {
                beatmap_md5_cache.set(map.md5, map, Date.now() + 3.6e+6);
            }
        }


        // return set, we made it all the way here!
        return set;
    }

}

module.exports = Beatmap;