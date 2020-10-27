const {app, BrowserWindow, ipcMain, globalShortcut, autoUpdater, dialog} = require('electron')

const path = require('path')

if(require('electron-squirrel-startup')) app.quit()

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

try {
    const server = 'https://hazel-worksnake.vercel.app'
    const feed = `${server}/update/${process.platform}/${app.getVersion()}`

    autoUpdater.setFeedURL(feed)

    autoUpdater.checkForUpdates()
    setTimeout(() => {
        autoUpdater.checkForUpdates()
    }, 10 * 60 * 1000)

    autoUpdater.on('update-downloaded', async () => {
        const response = await dialog.showMessageBox(null, {
            message: 'A new update is available and will be installed next restart\nRestart now?',
            title: 'Update available',
            type: 'info',
            buttons: [
                'install',
                'cancel'
            ]
        })

        if(response.response === 0) {
            autoUpdater.quitAndInstall()
        }
    })
} catch {}