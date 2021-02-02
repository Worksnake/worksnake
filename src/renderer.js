const {
	Tray,
	Menu,
	app,
	BrowserWindow,
	nativeImage,
	Notification,
	dialog,
} = require("electron").remote;
const { ipcRenderer } = require("electron");

const path = require("path");
const fs = require("fs");

var tray;
const createTray = async () => {
	tray = tray
		? tray
		: new Tray(
				nativeImage.createFromPath(path.join(__dirname, "assets", "icon.png"))
		  );
	const menu = Menu.buildFromTemplate([
		{
			label: "Quit",
			type: "normal",
			click: () => {
				app.quit();
			},
		},
		{
			label: "Config",
			type: "normal",
			click: () => {
				const window = new BrowserWindow({
					width: 800,
					height: 600,
					webPreferences: {
						nodeIntegration: true,
						enableRemoteModule: true,
					},
				});

				window.loadFile(path.join(__dirname, "config.html"));
			},
		},
		{
			label: "Check for updates",
			type: "normal",
			click: () => {
				if (!require("electron-is-dev")) {
					ipcRenderer.once("autoupdate.check.status", (e, status) => {
						switch (status) {
							case 1:
								new Notification({
									body:
										"A new update is available\nIt will download automaticly",
									title: "Worksnake updater",
								}).show();
								break;
							case 0:
								new Notification({
									body: "You are running the latest version",
									title: "Worksnake updater",
								}).show();
								break;
							case -1:
								new Notification({
									body: "Failed to check for updates",
									title: "Worksnake updater",
								}).show();
								break;
							default:
								break;
						}
					});

					ipcRenderer.send("autoupdate.check");
				} else {
					new Notification({
						body: "Can't check for updates in dev mode",
						title: "Worksnake updater",
					}).show();
				}
			},
		},
		{
			label: "About",
			type: "normal",
			click: () => {
				const window = new BrowserWindow({
					width: 800,
					height: 600,
					webPreferences: {
						nodeIntegration: true,
						enableRemoteModule: true,
					},
				});

				window.loadFile(path.join(__dirname, "about.html"));
			},
		},
		{
			label: "Start with computer",
			type: "checkbox",
			click: async (item) => {
				require("electron").ipcRenderer.once("autolaunch.set", (e, reply) => {
					item.checked = reply;
				});

				require("electron").ipcRenderer.send("autolaunch.set", item.checked);
			},
			checked: await (() => {
				return new Promise((resolve) => {
					require("electron").ipcRenderer.once("autolaunch.get", (e, reply) => {
						resolve(reply);
					});

					require("electron").ipcRenderer.send("autolaunch.get");
				});
			})(),
		},
		{
			label: "Statistics",
			type: "normal",
			click: () => {
				const window = new BrowserWindow({
					width: 800,
					height: 600,
					webPreferences: {
						nodeIntegration: true,
						enableRemoteModule: true,
					},
				});

				window.loadFile(path.join(__dirname, "statistics.html"));
			},
		},
		{
			label: "Profiles",
			type: "submenu",
			/**
			 * @type {Electron.MenuItem[]}
			 */
			submenu: (() => {
				const profiles = ipcRenderer.sendSync("getAllProfiles");
				const current = ipcRenderer.sendSync("getCurrentProfile");

				/**
				 * @type {Electron.MenuItem[]}
				 */
				const items = [];

				items.push({
					label: "Create profile",
					type: "normal",
					click: () => {
						require("electron-prompt")({
							title: "What name should the profile have?",
							type: "input",
							label: "Name: ",
						}).then((name) => {
							if (name === undefined || name === null) {
								dialog.showErrorBox(
									"Error creating profile",
									"The name must not be empty"
								);
							} else {
								ipcRenderer.send("createProfile", name);
								createTray();
							}
						});
					},
				});

				profiles.forEach((name) => {
					/**
					 * @type {Electron.MenuItem}
					 */
					const item = {
						checked: current === name,
						type: "checkbox",
						label: name,
						click: () => {
							ipcRenderer.send("switchProfile", name);
							createTray();
						},
					};

					items.push(item);
				});

				return items;
			})(),
		},
	]);

	tray.setToolTip("WorkSnake");
	tray.setContextMenu(menu);
};

BrowserWindow.getAllWindows()[0].hide();

const configFile = require("fs").existsSync(
	path.join(app.getPath("userData"), "config.json")
)
	? require("fs").readFileSync(
			path.join(app.getPath("userData"), "config.json")
	  )
	: null;
const defaultConfig = require("fs").readFileSync(
	path.join(__dirname, "config.default.json")
);

/**
 * @typedef {object} task
 * @property {number} interval
 * @property {number} time
 * @property {number} cancel
 * @property {boolean} cancelable
 * @property {boolean} blockInput
 */

/**
 * @type {{
 * latestProfile: string
 * tasks: task[],
 * profiles: Object<string, {
 * tasks: task[]
 * }>
 * }}
 */
const config = JSON.parse(configFile || defaultConfig);

if (config.latestProfile) {
	if (
		config.latestProfile !== "default" &&
		!config.profiles[config.latestProfile]
	)
		config.latestProfile = "default";
} else config.latestProfile = "default";

fs.writeFileSync(
	path.join(app.getPath("userData"), "config.json"),
	JSON.stringify(config),
	{
		encoding: "utf-8",
	}
);

require("electron").ipcRenderer.send("addProfile", "default");

for (var i = 0; i < config.tasks.length; i++) {
	const task = config.tasks[i];

	require("electron").ipcRenderer.send("applyPopup", {
		profile: "default",
		task: {
			interval: task.interval,
			time: task.time,
			cancel: task.cancel,
			cancelable: task.cancelable,
			blockInput: task.blockInput,
			blockOutput: task.blockOutput,
		},
	});
}

for (const name in config.profiles) {
	const profile = config.profiles[name];

	require("electron").ipcRenderer.send("addProfile", name);

	profile.tasks.forEach((task) =>
		require("electron").ipcRenderer.send("applyPopup", {
			profile: name,
			task: {
				interval: task.interval,
				time: task.time,
				cancel: task.cancel,
				cancelable: task.cancelable,
				blockInput: task.blockInput,
			},
		})
	);
}

require("electron").ipcRenderer.send("switchProfile", config.latestProfile);

createTray();
