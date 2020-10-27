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

        window.loadURL(`data:text/html,<script>const id = ${window.id}; const interval = ${task.interval}; const time = ${task.time}; const cancel = ${task.cancel};</script>${fs.readFileSync(path.join(__dirname, 'popup.html'))}`)
    }, task.interval * 1000)
}