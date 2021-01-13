// Modules
const Router = require("../../src/http/Router");

// Router
const router = new Router().domain("osu.ppy.sh");

/// BEATMAP SUBMISSION ///

// beatmap submission is a convoluted mess, so i'll be documenting all of my findings
// and observations here, primarily to have a better sense of documentation so that i
// can start on it, eventually

// [/web/osu-osz2-bmsubmit-getid.php]: [GET]
// exists to kickstart a beatmap, and get an id or verify ownership
// query parameters:
// u: username
// h: password hash
// s: set id, if any (-1 if new map)
// b: beatmap ids (seperated by , delimiter)
// z: osz2 hash (if any)
// vv: version

// [/web/osu-osz2-bmsubmit-upload.php]: [POST]
// the beatmap upload, where the osz is submitted
// parameters:
// u: username
// h: password hash
// t: whether to fully submit the map or not (for new uploads) (0 for update, 1 for new upload)
// vv: version
// z: osz2 hash (if any)
// s: set id
// osz2: the osz2 file, we will need to properly decompress this.

// [/web/osu-osz2-bmsubmit-post.php]: [POST]
// to post data like description and what not, or something
// parameters:
// u: username
// p: password hash (why is it "p" here, but "h" for the rest of the endpoints?)
// b: beatmapset id (why not s????)
// vv: version
// subject: the name of the beatmap, or title (artist - song title)
// message: topic message, alongside the description to put for the beatmap (seperated by a "---------------" delimter)
// complete: whether or not the mapset is approved, or not. the map is considered "complete" when it is ranked or approved.

/// OSZ DOCUMENTATION ///

// we will need to decompress the osz to get the proper respective difficulties and data
// from it. unfortunately, it's quite a confusing process and i don't think that i can
// handle it by myself. i'll still document it incase i do find someone who can help,
// though.

// ill do my best to provide an example osz based off a pre-created beatmap being 
// submitted over to bancho. the file i will be using is "asphodelos.osz2".

// sidenote: some of the file data is AES-256 encrypted, so we'll need to find
//           the given secret key to decrypt those portions.


/// OSZ2 HEADER
// the first 20 bytes are the osz header.

// mag*1    *2 initialization vector*3
// EC 48 4F 00 EB 52 4C A0 79 66 6D 05 6B EE 38 EE 1B BB AB DF
// 0        3  4                                                          

/// METADATA HASH
// the oszhash for metadata.

// hash of metadata
// F9 D7 B5 50 AD D0 88 7F 62 06 EC D1 63 7A F5 17
// 20

/// FILEINFO HASH
// the oszhash for file info.

// hash of the file info
// C7 E8 3C FB 73 6C 7F 86 30 E0 52 83 C9 73 83 09
// 36

/// FILEDATA HASH
// the oszhash for file data.

// hash of the data
// 7D E9 70 5F 9F 5E 01 10 6C 61 1E 9E D8 69 71 C1
// 56

//// METADATA BLOCK

// the metadata of the beatmaps, namely stuff like difficulty data and such.

/// METADATA EXAMPLE

// FIRST PART
// the first 4 bytes of the metadata block, or the number of metadata entries.

// amount *4
// 08 00 00 00
// 0

// SECOND PART
// the thing that continues on and on till all metadata entries are read.
// this will come after the amount of metadata entries.

// type*5 *6  beatmap id
// 09 00  07  31 33 34 36 38 33 30
// 0          4?

//// SIDENOTES:
// *1 = magic number hex, primarily known in binary formats as an identifier string. this will be "EC 48 4F".
// *2 = beatmap version, most likely.
// *3 = intitialization vector. i'm...actually unsure whether this is the decrypthion key or not.

// *4 = this tells us that there are 8 metadata entries, and that we'll need to parse them.
// *5 = the type, here's the enum.
// enum: 
//     Title, // 1
//     Artist, // 2
//     Creator, // 3
//     Version, // 4
//     Source, // 5
//     Tags, // 6
//     VideoDataOffset, // 7
//     VideoDataLength, // 8
//     VideoHash, // 9
//     BeatmapSetID, // 10
//     Genre, // 11
//     Language, // 12
//     TitleUnicode, // 13
//     ArtistUnicode, // 14
//     Unknown = 9999, // 9999
//     Difficulty, // 15
//     PreviewTime, // 16
//     ArtistFullName, // 17
//     ArtistTwitter, // 18
//     SourceUnicode, // 19
//     ArtistUrl, // 20
//     Revision, // 21
//     PackId // 22
// }
// *6 = i don't actually know what this random byte is here for

// #TODO: beatmap submission.

module.exports = router;