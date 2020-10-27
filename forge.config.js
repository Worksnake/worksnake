module.exports = {
    packagerConfig: {
        asar: true,
        icon: "src/assets/logo.icns",
        arch: [
            "x64"
        ],
        platform: [
            "darwin",
            "win32"
        ]
    },
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "worksnake"
            }
        },
        {
            name: "@electron-forge/maker-zip",
            platforms: [
                "darwin"
            ]
        },
        {
            name: "@electron-forge/maker-deb",
            config: {}
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {}
        }
    ]
}