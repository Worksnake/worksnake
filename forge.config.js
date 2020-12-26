const fs = require('fs')

var githubAuthToken = ''
if(fs.existsSync('./env/githubToken.js')) {
    githubAuthToken = require('./env/githubToken')
}

module.exports = {
    packagerConfig: {
        asar: true,
        icon: 'src/assets/logo.icns'
    },
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'worksnake'
            }
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: [
                'darwin'
            ]
        },
        {
            name: '@electron-forge/maker-deb',
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
                draft: true,
                authToken: githubAuthToken //Unpublished, contains my github access token
                //Yes, the token that was here before open source is no longer valid, I regenerated it
            }
        }
    ]
}