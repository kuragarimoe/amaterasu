/*
    osu!katagiri loader 

    this file works as a bootstrapper to load the basic core components to the server,
    as long as all things are properly configured.
*/
(async () => { // ASYNC FUNCTION
    /// GLOBALS ///

    await require("./preload/globals")();

    /// PRE-INIT ///
    glob.version = glob.config._internal.version // take the internal version and set it

    glob.mem_usage = () => {
        return (Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100) + "MB";
    }

    /// INIT ///

    require("./src/Amaterasu");
})()