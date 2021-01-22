const {EventEmitter} = require('events')
const rp = require('request-promise')
const {app} = require('electron')
const semver = require('semver')
const fs = require('fs')
const path = require('path')

module.exports = class AutoUpdater extends EventEmitter {
    owner = 'Worksnake'
    repo = 'worksnake-releases'

    baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}`
    
    currentVersion = app.getVersion()

    findAppropriateArtifact(tag) {
        switch(process.platform) {
            case 'win32':
                return tag.assets.filter(asset => asset.name.endsWith('.exe'))[0]
            case 'linux':
                return tag.assets.filter(asset => asset.name.endsWith('.AppImage'))[0]
            case 'darwin':
                return tag.assets.filter(asset => asset.name.endsWith('.dmg'))[0]
        }
    }

    async checkForUpdates() {
        const latest = await rp(`${this.baseUrl}/releases/latest`, {
            json: true,

            headers: {
                "User-Agent": "required/1.0.0"
            }
        })

        if(semver.satisfies(semver.coerce(latest.tag_name), `>${semver.coerce(this.currentVersion)}`)) {
            this.emit('update-available')

            const artifact = this.findAppropriateArtifact(latest)
            const artifactUrl = artifact.browser_download_url

            const savePath = path.join(app.getPath('temp'), `worksnake-update${path.extname(artifact.name)}`)

            rp(artifactUrl)
                .pipe(fs.createWriteStream(savePath))
                .on('close', () => {
                    this.emit('update-downloaded', savePath)
                })
        }else {
            this.emit('update-not-available')
        }
    }
} 