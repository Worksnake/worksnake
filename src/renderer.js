const {Tray, Menu, app, BrowserWindow} = require('electron').remote

const path = require('path')
const fs = require('fs')

var tray;
const createTray = async () => {
    tray = new Tray(path.join(__dirname, 'assets', 'icon.png'))
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
                const {Notification} = require('electron').remote
                const {autoUpdater} = require('electron-updater')

                autoUpdater.once('update-available', () => {
                    const popup = new Notification({
                        body: 'A new update is available\nIt will download automaticly',
                        title: 'Worksnake updater'
                    })

                    popup.show()
                })
                    
                autoUpdater.once('update-not-available', () => {
                    const popup = new Notification({
                        body: 'You are running the latest version',
                        title: 'Worksnake updater'
                    })

                    popup.show()
                })

                autoUpdater.checkForUpdates().catch(() => {
                    const popup = new Notification({
                        body: 'Failed to check for updates',
                        title: 'Worksnake updater'
                    })

                    popup.show()
                })
            }
        },
        {
            label: 'About',
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

                window.loadFile(path.join(__dirname, 'about.html'))
            }
        },
        {
            label: 'Start with computer',
            type: 'checkbox',
            click: async (item) => {
                require('electron').ipcRenderer.once('autolaunch.set', (e, reply) => {
                    item.checked = reply
                })

                require('electron').ipcRenderer.send('autolaunch.set', item.checked)
            },
            checked: await (() => {
                return new Promise(resolve => {
                    require('electron').ipcRenderer.once('autolaunch.get', (e, reply) => {
                        resolve(reply)
                    })

                    require('electron').ipcRenderer.send('autolaunch.get')
                })
            })()
        },
        {
            label: 'Statistics',
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

                window.loadFile(path.join(__dirname, 'statistics.html'))
            }
        }
    ])

    tray.setToolTip('WorkSnake')
    tray.setContextMenu(menu)
}

createTray()

//BrowserWindow.getAllWindows()[0].hide()

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

    require('electron').ipcRenderer.send('popup', {
        interval: task.interval,
        time: task.time,
        cancel: task.cancel,
        cancelable: task.cancelable
    })
}