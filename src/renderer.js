const {Tray, Menu, nativeImage, app, BrowserWindow} = require('electron').remote

const path = require('path')
const fs = require('fs')

var tray;
const createTray = () => {
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'logo.jpg')))
    const menu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            type: 'normal',
            click: () => {
                app.quit()
            }
        },
        {
            label: 'Config',
            type: 'normal',
            click: () => {
                const window = new BrowserWindow({
                    width: 800,
                    height: 600,
                    webPreferences: {
                        nodeIntegration: true,
                        enableRemoteModule: true
                    }
                })

                window.loadFile(path.join(__dirname, 'config.html'))
            }
        },
        {
            label: 'Check for updates',
            type: 'normal',
            click: () => {
                const {autoUpdater, Notification} = require('electron').remote

                try {
                    var n = null;

                    autoUpdater.once('checking-for-update', () => {
                        const popup = new Notification({
                            body: 'Checking for updates',
                            title: 'Worksnake updater'
                        })

                        popup.show()

                        n = popup
                    })
                    autoUpdater.once('update-available', () => {

                        if(n) n.close()

                        const popup = new Notification({
                            body: 'A new update is available\nIt will be automaticly downloaded',
                            title: 'Worksnake updater'
                        })

                        popup.show()
                    })
                    autoUpdater.once('update-not-available', () => {

                        if(n) n.close()

                        const popup = new Notification({
                            body: 'You already have the latest version',
                            title: 'Worksnake updater'
                        })

                        popup.show()
                    })
                    
                    autoUpdater.checkForUpdates()
                } catch {
                    const popup = new Notification({
                        body: 'Failed to check for updates',
                        title: 'Worksnake updater'
                    })

                    popup.show()
                }
            }
        },
        {
            label: 'About',
            type: 'normal',
            click: () => {
                const window = new BrowserWindow({
                    width: 800,
                    height: 600
                })

                window.loadFile(path.join(__dirname, 'about.html'))
            }
        }
    ])

    tray.setToolTip('WorkSnake')
    tray.setContextMenu(menu)
}

createTray()

BrowserWindow.getAllWindows()[0].hide()

var configFile = null

if(fs.existsSync(path.join(app.getPath('userData'), 'config.json'))) {
    try {
        const c = require('fs').readFileSync(path.join(app.getPath('userData'), 'config.json'))

        configFile = JSON.parse(c)
    } catch {}
}

const defaultConfig = require(path.join(__dirname, 'config.default.js'))

var config
try {
    config = JSON.parse(configFile || defaultConfig)
} catch {
    config = configFile || defaultConfig
}

fs.writeFileSync(path.join(app.getPath('userData'), 'config.json'), JSON.stringify(config), {
    encoding: 'utf-8'
})

for(var i = 0; i < config.tasks.length; i++) {
    const task = config.tasks[i]

    setInterval(() => {
        const window = new BrowserWindow({
            alwaysOnTop: true,
            center: true,
            width: 200,
            height: 100,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true
            }
        })

        var cancelable
        if(task.cancelable === false) {
            cancelable = false
        }else {
            cancelable = true
        }

        window.loadURL(`data:text/html,<script>const id = ${window.id}; const interval = ${task.interval}; const time = ${task.time}; const cancel = ${task.cancel}; const cancelable = ${cancelable};</script>${fs.readFileSync(path.join(__dirname, 'popup.html'))}`)
    }, task.interval * 1000)
}