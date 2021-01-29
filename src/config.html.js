const path = require("path");
const { app } = require("electron").remote;

const currentProfile = require("electron").ipcRenderer.sendSync(
	"getCurrentProfile"
);

var cfg = require("fs").readFileSync(
	path.join(app.getPath("userData"), "config.json"),
	{
		encoding: "utf-8",
	}
);

function processConfig() {
	const elements = document.getElementsByClassName("configRow");

	var tasks = [];

	for (var i = 0; i < elements.length; i++) {
		const el = elements[i];

		const interval = Number(el.firstChild.innerText);
		const time = Number(el.firstChild.nextSibling.innerText);
		const cancel = Number(el.firstChild.nextSibling.nextSibling.innerText);
		const cancelable =
			el.firstChild.nextSibling.nextSibling.nextSibling.firstChild.checked;
		const blockInput =
			el.firstChild.nextSibling.nextSibling.nextSibling.nextSibling.firstChild
				.checked;

		tasks.push({
			interval: isNaN(interval) ? null : interval * 60,
			time: isNaN(time) ? null : time,
			cancel: isNaN(cancel) ? null : cancel * 60,
			cancelable: cancelable,
			blockInput: blockInput,
		});
	}

	tasks = tasks.filter(
		(t) =>
			t.interval &&
			t.time &&
			t.cancel &&
			t.cancelable !== null &&
			t.blockInput !== null
	);

	const c = JSON.parse(cfg);
	if (currentProfile === "default") {
		c.tasks = tasks;
	} else {
		c.profiles[currentProfile].tasks = tasks;
	}
	cfg = JSON.stringify(c);
}

var c = JSON.parse(cfg);
if (currentProfile !== "default") c = c.profiles[currentProfile];

const el = document.getElementById("config");

for (var i = 0; i < c.tasks.length; i++) {
	const task = c.tasks[i];

	const row = document.createElement("tr");
	row.classList.add("configRow");

	{
		const td = document.createElement("td");
		td.contentEditable = true;
		td.style = "border-style: solid; border-color: black; border-width: 5px;";

		td.innerText = task.interval / 60;

		row.appendChild(td);

		td.addEventListener("input", () => {
			processConfig();
		});
	}

	{
		const td = document.createElement("td");
		td.contentEditable = true;
		td.style = "border-style: solid; border-color: black; border-width: 5px;";

		td.innerText = task.time;

		row.appendChild(td);

		td.addEventListener("input", () => {
			processConfig();
		});
	}

	{
		const td = document.createElement("td");
		td.contentEditable = true;
		td.style = "border-style: solid; border-color: black; border-width: 5px;";

		td.innerText = task.cancel / 60;

		row.appendChild(td);

		td.addEventListener("input", () => {
			processConfig();
		});
	}

	{
		const td = document.createElement("td");

		const check = document.createElement("input");
		check.type = "checkbox";

		check.checked = task.cancelable;

		td.appendChild(check);

		row.appendChild(td);

		check.addEventListener("input", () => {
			processConfig();
		});
	}

	{
		const td = document.createElement("td");

		const check = document.createElement("input");
		check.type = "checkbox";

		check.checked = task.blockInput;

		td.appendChild(check);

		row.appendChild(td);

		check.addEventListener("input", () => {
			processConfig();
		});
	}

	{
		const td = document.createElement('td')

		const btn = document.createElement('button')
		btn.onclick = () => {
			row.classList.add('hidden')
			row.firstChild.innerText = ''
			processConfig()
		}
		btn.innerText = 'Delete'

		td.appendChild(btn)

		row.appendChild(td)
	}

	el.appendChild(row);
}

processConfig();

// eslint-disable-next-line no-unused-vars
function newRow() {
	const el = document.getElementById("config");

	const row = document.createElement("tr");
	row.classList.add("configRow");

	for (var i = 0; i < 6; i++) {
		const td = document.createElement("td");

		if (i < 3) {
			td.contentEditable = true;
			td.style = "border-style: solid; border-color: black; border-width: 5px;";
			row.appendChild(td);

			td.addEventListener("input", () => {
				processConfig();
			});
		} else if (i < 5) {
			const check = document.createElement("input");
			check.type = "checkbox";

			td.appendChild(check);

			row.appendChild(td);

			check.addEventListener("input", () => {
				processConfig();
			});
		}else {
			console.log('called')
			const btn = document.createElement('button')
			btn.onclick = () => {
				row.classList.add('hidden')
				row.firstChild.innerText = ''
				processConfig()
			}
			btn.innerText = 'Delete'

			td.appendChild(btn)

			row.appendChild(td)
		}
	}

	el.appendChild(row);
}

// eslint-disable-next-line no-unused-vars
function save() {
	require("fs").writeFileSync(
		path.join(app.getPath("userData"), "config.json"),
		cfg,
		{
			encoding: "utf-8",
		}
	);

	require("electron").ipcRenderer.send("relaunch");

	window.close();
}
