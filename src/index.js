const {app, BrowserWindow, ipcMain, dialog, shell} = require('electron')
const {autoUpdater} = require('electron-updater')

app.allowRendererProcessReuse = false

const AutoLaunch = require('auto-launch')

const path = require('path')

if(require('electron-squirrel-startup')) app.quit()

//if(!app.requestSingleInstanceLock) app.quit()

const autoLaunch = new AutoLaunch({
    name: 'Worksnake'
})

const fs = require('fs')

if(!fs.existsSync(path.join(app.getPath('userData'), 'autoLaunch'))) {
    fs.writeFileSync(path.join(app.getPath('userData'), 'autoLaunch'), '')
    autoLaunch.enable()
}

const createWindow = () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })

    window.loadFile(path.join(__dirname, 'index.html'))

    window.webContents.openDevTools()
}

app.whenReady().then(createWindow)

ipcMain.on('hide', (e, id) => {
    BrowserWindow.fromId(id).hide()
})

ipcMain.on('show', (e, id) => {
    BrowserWindow.fromId(id).show()
})

ipcMain.on('relaunch', () => {
    app.relaunch()
    app.quit()
})

ipcMain.on('autolaunch.set', async (e, state) => {
    if(state === true) {
        await autoLaunch.enable()
    }else if(state === false) {
        await autoLaunch.disable()
    }

    e.reply('autolaunch.set', await autoLaunch.isEnabled())
})

ipcMain.on('autolaunch.get', async (e) => {
    e.reply('autolaunch.get', await autoLaunch.isEnabled())
})

const createPopup = data => {
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
    if(data.cancelable === null || data.cancelable === undefined) {
        cancelable = false
    }else {
        cancelable = data.cancelable
    }

    window.loadURL(`data:text/html,<script>const id = ${window.id}; const interval = ${data.interval}; const time = ${data.time}; const cancel = ${data.cancel}; const cancelable = ${cancelable};</script>${require('fs').readFileSync(path.join(__dirname, 'popup.html'))}`)
}

ipcMain.on('popup', (e, data) => {
    setTimeout(() => {
        createPopup(data)
    }, data.interval * 1000)
})

ipcMain.on('statistics.postpone', () => {
    const date = new Date()

    fs.appendFileSync(path.join(app.getPath('userData'), 'statistics'), `${date.toISOString()}_postpone;`)
})

ipcMain.on('statistics.skip', () => {
    const date = new Date()

    fs.appendFileSync(path.join(app.getPath('userData'), 'statistics'), `${date.toISOString()}_skip;`)
})

ipcMain.on('statistics.break', () => {
    const date = new Date()

    fs.appendFileSync(path.join(app.getPath('userData'), 'statistics'), `${date.toISOString()}_break;`)
})

autoUpdater.autoDownload = false

/*autoUpdater.on('update-downloaded', async () => {
    const response = await dialog.showMessageBox(null, {
        message: 'A new update is available and will be installed next restart\nRestart now?',
        title: 'Update available',
        type: 'info',
        buttons: [
            'Restart and install now',
            'I\'ll restart later'
        ]
    })

    if(response.response === 0) {
        setImmediate(() => {
            autoUpdater.quitAndInstall()
        })
    }
})*/

var wasPrompted = false

autoUpdater.on('update-available', 
/**
 * @param {import('electron-updater').UpdateInfo} info
 */
async info => {
    if(wasPrompted) return

    wasPrompted = true

    const response = await dialog.showMessageBox(null, {
        message: 'A new update is available',
        title: 'Update available',
        type: 'info',
        buttons: [
            'Download and install now (Worksnake will restart)',
            'Don\'t install'
        ]
    })

    if(response.response === 0) {
        const filename = 'worksnake_update_install.' + path.extname(info.files[0].url)
        require('request')(`https://github.com/Worksnake/worksnake-releases/releases/download/v${info.version}/${info.files[0].url}`).pipe(fs.createWriteStream(path.join(app.getPath('temp'), filename))).on('close', () => {
            shell.openPath(path.join(app.getPath('temp'), filename))
        })
    }
})

if(!require('electron-is-dev')) {
    autoUpdater.checkForUpdates().catch()
    setTimeout(() => {
        autoUpdater.checkForUpdates().catch()
    }, 15 * 60 * 1000)
}

ipcMain.on('autoupdate.check', async e => {
    autoUpdater.once('update-available', () => {
        wasPrompted = false
        e.reply('autoupdate.check.status', 1)
    })

    autoUpdater.once('update-not-available', () => {
        e.reply('autoupdate.check.status', 0)
    })

    autoUpdater.checkForUpdates().catch(() => {
        e.reply('autoupdate.check.status', -1)
    })
})