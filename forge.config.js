module.exports = {
    packagerConfig: {
        asar: true,
        icon: "src/assets/logo.icns"
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
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: '112batman',
                    name: 'worksnake-releases'
                },
                prerelease: false,
                draft: true
            }
        }
    ]
}