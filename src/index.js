const {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	shell,
	screen,
} = require("electron");
//Disabled until electon-updater is fixed
//const {autoUpdater} = require('electron-updater')

app.allowRendererProcessReuse = false;

const AutoLaunch = require("auto-launch");

const path = require("path");

if (require("electron-squirrel-startup")) app.quit();

//if(!app.requestSingleInstanceLock) app.quit()

const autoLaunch = new AutoLaunch({
	name: "Worksnake",
});

const fs = require("fs");
const AutoUpdater = require("./AutoUpdater");

if (!fs.existsSync(path.join(app.getPath("userData"), "autoLaunch"))) {
	fs.writeFileSync(path.join(app.getPath("userData"), "autoLaunch"), "");
	autoLaunch.enable();
}

const createWindow = () => {
	const window = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		},
	});

	window.loadFile(path.join(__dirname, "index.html"));

	window.webContents.openDevTools();
};

app.whenReady().then(createWindow);

ipcMain.on("hide", (e, id) => {
	BrowserWindow.fromId(id).hide();
});

ipcMain.on("show", (e, id) => {
	BrowserWindow.fromId(id).show();
});

ipcMain.on("relaunch", () => {
	app.relaunch();
	app.quit();
});

ipcMain.on("autolaunch.set", async (e, state) => {
	if (state === true) {
		await autoLaunch.enable();
	} else if (state === false) {
		await autoLaunch.disable();
	}

	e.reply("autolaunch.set", await autoLaunch.isEnabled());
});

ipcMain.on("autolaunch.get", async (e) => {
	e.reply("autolaunch.get", await autoLaunch.isEnabled());
});

const createPopup = (data) => {
	const window = new BrowserWindow({
		alwaysOnTop: true,
		center: true,
		width: 200,
		height: 100,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		},
	});

	var cancelable;
	if (data.cancelable === null || data.cancelable === undefined) {
		cancelable = false;
	} else {
		cancelable = data.cancelable;
	}

	window.loadURL(
		`data:text/html,<script>const id = ${window.id}; const interval = ${
			data.interval
		}; const time = ${data.time}; const cancel = ${
			data.cancel
		}; const cancelable = ${cancelable};</script>${require("fs").readFileSync(
			path.join(__dirname, "popup.html")
		)}`.replace(
			'<script src="popup.html.js"></script>',
			`<script>${fs.readFileSync(
				path.join(__dirname, "popup.html.js")
			)}</script>`
		)
	);

	var blockInput;
	if (data.blockInput === null || data.blockInput === undefined) {
		blockInput = false;
	} else {
		blockInput = data.blockInput;
	}

	if (blockInput) {
		/**
		 * @type {BrowserWindow[]}
		 */
		const inputBlockers = [];

		screen.getAllDisplays().forEach((display) => {
			const blocker = new BrowserWindow({
				frame: false,
				transparent: true,
				skipTaskbar: true,
				alwaysOnTop: true,

				x: display.bounds.x,
				y: display.bounds.y,
			});

			blocker.maximize();
			blocker.show();

			inputBlockers.push(blocker);
		});

		window.show();

		window.on("hide", () => {
			inputBlockers.forEach((blocker) => blocker.hide());
		});

		window.on("show", () => {
			inputBlockers.forEach((blocker) => blocker.show());
			window.show();
		});

		window.on("closed", () => {
			inputBlockers.forEach((blocker) => blocker.destroy());
		});
	}
};

const active = new Map();
var currentProfile = "";
const profiles = new Map();

function setPopup(data) {
	const timeout = setTimeout(() => {
		createPopup(data);
		active
			.get(currentProfile)
			.splice(active.get(currentProfile).indexOf(timeout), 1);
	}, data.interval * 1000);

	if (active.has(currentProfile)) {
		active.get(currentProfile).push(timeout);
	} else {
		active.set(currentProfile, [timeout]);
	}
}

ipcMain.on("popup", (e, data) => {
	setPopup(data);
});

ipcMain.on("applyPopup", (e, data) => {
	if (profiles.has(data.profile)) {
		profiles.get(data.profile).tasks.push(data.task);
	} else {
		profiles.set(data.profile, {
			tasks: [data.task],
		});
	}
});

ipcMain.on("switchProfile", (e, newProfile) => {
	if (active.has(currentProfile)) {
		active.get(currentProfile).forEach((timeout) => {
			clearTimeout(timeout);
		});
		active.delete(currentProfile);
	}

	currentProfile = newProfile;

	profiles.get(currentProfile).tasks.forEach((task) => {
		setPopup(task);
	});
});

ipcMain.on("getCurrentProfile", (e) => {
	e.returnValue = currentProfile;
});

ipcMain.on("getAllProfiles", (e) => {
	e.returnValue = [...profiles.keys()];
});

ipcMain.on("createProfile", (e, name) => {
	if (!profiles.has(name)) {
		profiles.set(name, {
			tasks: [],
		});

		var config = JSON.parse(
			fs.readFileSync(path.join(app.getPath("userData"), "config.json"))
		);
		if(!config.profiles) config.profiles = {}
		config.profiles[name] = {
			tasks: [],
		};
		fs.writeFileSync(
			path.join(app.getPath("userData"), "config.json"),
			JSON.stringify(config)
		);
	}
});

ipcMain.on("addProfile", (e, name) => {
	if (!profiles.has(name))
		profiles.set(name, {
			tasks: [],
		});
});

ipcMain.on("statistics.postpone", () => {
	const date = new Date();

	fs.appendFileSync(
		path.join(app.getPath("userData"), "statistics"),
		`${date.toISOString()}_postpone;`
	);
});

ipcMain.on("statistics.skip", () => {
	const date = new Date();

	fs.appendFileSync(
		path.join(app.getPath("userData"), "statistics"),
		`${date.toISOString()}_skip;`
	);
});

ipcMain.on("statistics.break", () => {
	const date = new Date();

	fs.appendFileSync(
		path.join(app.getPath("userData"), "statistics"),
		`${date.toISOString()}_break;`
	);
});

//Code disabled to electron-updater is fixed
/*autoUpdater.autoDownload = false

autoUpdater.on('update-downloaded', async () => {
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

var wasPrompted = false;

const autoUpdater = new AutoUpdater();

autoUpdater.on("update-downloaded", async (path) => {
	if (wasPrompted) return;

	wasPrompted = true;

	const response = await dialog.showMessageBox(null, {
		message: "A new update is available",
		title: "Update available",
		type: "info",
		buttons: ["Install now (Worksnake will restart)", "Don't install"],
	});

	if (response.response === 0) {
		shell.openPath(path);
		app.exit();
	}
});

if (!require("electron-is-dev")) {
	autoUpdater.checkForUpdates().catch();
	setTimeout(() => {
		autoUpdater.checkForUpdates().catch();
	}, 15 * 60 * 1000);
}

ipcMain.on("autoupdate.check", async (e) => {
	wasPrompted = false;

	autoUpdater.once("update-available", () => {
		e.reply("autoupdate.check.status", 1);
	});

	autoUpdater.once("update-not-available", () => {
		e.reply("autoupdate.check.status", 0);
	});

	autoUpdater.checkForUpdates().catch(() => {
		e.reply("autoupdate.check.status", -1);
	});
});
