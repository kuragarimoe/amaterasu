exports.Type = {
    String: 0,
    Byte: 1,
    Int8: 1,
    Raw: 2,
    Int: 3,
    Long: 4,
    Float: 5,
    Short: 6,
    UInt: 7,
    ULong: 8,
    ArrayOfValues: 9,
    UShort: 10,
};

exports.Permissions = {
    // GENERAL PERMISSIONS
    Banned: 1 << 0,
}

exports.ClientPermissions = {
    Player: 1 << 0,
    Moderator: 1 << 1,
    Supporter: 1 << 2,
    Owner: 1 << 3,
    Developer: 1 << 4,
    Tournament:  1 << 5
}