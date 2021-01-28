//Disabled because many variables ary programaticly injected into file
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

console.log("Loaded");

var cancelled = false;

function buttonClose() {
	require("electron").ipcRenderer.send("statistics.postpone");

	/*window.innerWidth = 0;
    window.innerHeight = 0;*/

	cancelled = true;

	require("electron").ipcRenderer.send("hide", id);

	setTimeout(() => {
		require("electron").ipcRenderer.send("show", id);
		start();
	}, cancel * 1000);

	//window.close()
}

function handleClose() {
	require("electron").ipcRenderer.send("popup", {
		interval: interval,
		time: time,
		cancel: cancel,
		cancelable: cancelable,
	});
}

function forceClose() {
	require("electron").ipcRenderer.send("statistics.skip");

	handleClose();
	window.close();
}

function start() {
	cancelled = false;

	const el = document.getElementById("timeLeft");
	const el2 = document.getElementById("timeLeftText");

	var t = time - 1;

	el2.innerHTML = `${t + 1} seconds left`;
	el.style.width = `${100 - Math.floor((100 / time) * t)}%`;

	const task = setInterval(() => {
		el2.innerHTML = `${t} seconds left`;
		el.style.width = `${100 - Math.floor((100 / time) * t)}%`;

		if (cancelled) {
			clearInterval(task);
			clearInterval(task2);
		}

		if (t < 1) {
			require("electron").ipcRenderer.send("statistics.break");

			handleClose();
			window.close();
		}

		t--;
	}, 1000);

	var prev;

	const task2 = setInterval(() => {
		const cursorScreenPoint = require("electron").remote.screen.getCursorScreenPoint();

		if (!prev) {
			prev = cursorScreenPoint;
			return;
		}

		//cursorScreenPoint.x !== prev.x || cursorScreenPoint.y !== prev.y
		square = (num) => {
			return num * num;
		};
		if (
			Math.sqrt(
				square(prev.x - cursorScreenPoint.x) -
					square(prev.y - cursorScreenPoint.y)
			) > 5
		) {
			t = time;
			el2.innerHTML = `${t} seconds left`;
			el.style.width = `${100 - Math.floor((100 / time) * t)}%`;
		}

		prev = cursorScreenPoint;
	}, 100);
}

{
	const el = document.getElementById("text");
	el.innerHTML = `${time} second break`;
}

if (cancelable) {
	const btn = document.createElement("button");
	btn.innerText = "Skip";
	btn.onclick = forceClose;

	document.body.appendChild(btn);
}

start();
