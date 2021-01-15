// Modules
const crypto = require('crypto');
const Router = require("../../src/http/Router");
const { Hash } = require('../../src/util/Util');
const Util = require('../../src/util/Util');

// Router
const router = new Router().domain("osu.ppy.sh");

// #POST [/users]
router.handle("/users", ["POST"], async (req, res) => {
    let errors = {
        "username": [],
        "user_email": [],
        "password": []
    };

    // the client is doing something.
    if (req.body["check"] != "0")
        return res.send("ok");

    // missing parameters, so lets end now.
    if (!req.validate(["user[username]", "user[user_email]", "user[password]"]))
        return res.status(400).send("Parameters to the request is missing. Please try again with the proper body.");

    // we will be checking if the username and/ or email is taken.
    let [users, _] = await glob.db.execute(`
    SELECT * FROM users
    WHERE username = ?
    `, [ req.body["user[username]"] ]);

    let [emails, __] = await glob.db.execute(`
    SELECT * FROM users
    WHERE email = ?
    `, [ req.body["user[user_email]"] ]);

    // the username is taken.
    if (users[0])
        errors["username"].push("This username is already taken.");

    // or the email, that's taken too.
    if (emails[0])
        errors["user_email"].push("This email is already in use.");

    // utilizing a banned username, we cannot allow that
    if (glob.config.users["banned_names"].includes(req.body["user[username]"].toLowerCase()))
        errors["username"].push("This username is not allowed to be used.");

    // password is less than required length.
    if (req.body["user[password]"].length < 8)
        errors["password"].push("The password is less than 8 characters in length.");

    // there was errors, so we'll have to end it here
    if (errors.username.length > 0 || errors.user_email.length > 0 || errors.password.length > 0)
        return res.status(400).send("{'form_error': {'user': " + JSON.stringify(errors) + " } }");

    // all checks passed, we can register.
    if (req.body["check"] == "0") {
        let hash = Hash.encrypt(Hash.md5(req.body["user[password]"]));
        let safe_username = req.body["user[username]"].replace(" ", "_").toLowerCase();

        // insert user into database.
        await glob.db.execute(`
        INSERT INTO users 
            (\`id\`, 
            \`username\`, 
            \`safe_username\`, 
            \`password_hash\`, 
            \`email\`, 
            \`register_time\`,
             \`last_activity\`, 
             \`roles\`, 
             \`password_version\`
            ) 
        VALUES (NULL, ?, ?, ?, ?, ?, ?, '18', '1')
        `, [ req.body["user[username]"], safe_username, hash, req.body["user[user_email]"], Util.toUnix(Date.now()), Util.toUnix(Date.now()) ]);

        // get newly created user.
        var [user, ___] = await glob.db.execute("SELECT id FROM users WHERE safe_username = ?", [safe_username]);

        // insert scores.
        await glob.db.execute("INSERT INTO userstats_vn (id) VALUES (?)", [user[0].id]);
        await glob.db.execute("INSERT INTO userstats_rx (id) VALUES (?)", [user[0].id]);
        await glob.db.execute("INSERT INTO userstats_ap (id) VALUES (?)", [user[0].id]);
    }

    // send okay
    res.send("ok");
});

// bancho-connect.php
router.handle("/web/bancho_connect.php", ["POST"], (req, res) => {
    res.send("hi!");
})

// osu-getfriends.php
router.handle("/web/osu-getfriends.php", ["GET"], (req, res) => {
    // TODO: actually make it lol
    res.send("");
})

// lastfm.php
router.handle("/web/lastfm.php", ["GET"], (req, res) => {
    // TODO: actually make it lol
    res.send("-3");
});

module.exports = router;