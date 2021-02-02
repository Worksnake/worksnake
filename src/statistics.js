const fs = require("fs");
const { app } = require("electron").remote;
const path = require("path");
const Chart = require("chart.js");

function displayStats() {
	const currentProfile = require("electron").ipcRenderer.sendSync(
		"getCurrentProfile"
	);

	if (
		!fs.existsSync(
			path.join(
				app.getPath("userData"),
				currentProfile === "default"
					? "statistics"
					: `${currentProfile}__statistics`
			)
		)
	)
		fs.writeFileSync(
			path.join(
				app.getPath("userData"),
				currentProfile === "default"
					? "statistics"
					: `${currentProfile}__statistics`
			),
			""
		);

	const stats = fs.readFileSync(
		path.join(
			app.getPath("userData"),
			currentProfile === "default"
				? "statistics"
				: `${currentProfile}__statistics`
		),
		{
			encoding: "utf-8",
		}
	);

	if (stats === "") {
		document.getElementById("no_data").classList.remove("hidden");
		document.getElementById("canvas").classList.add("hidden");
	} else {
		document.getElementById("no_data").classList.add("hidden");
		document.getElementById("canvas").classList.remove("hidden");

		const ctx = document.getElementById("canvas").getContext("2d");
		new Chart(ctx, {
			type: "pie",
			data: {
				labels: ["took", "skipped", "postponed"],
				datasets: [
					{
						backgroundColor: ["green", "red", "orange"],
						data: (() => {
							var took = 0;
							var skipped = 0;
							var postponed = 0;

							const points = stats.split(";");

							for (var i = 0; i < points.length; i++) {
								const point = points[i];

								// eslint-disable-next-line no-unused-vars
								const date = new Date(point.split("_")[0]);
								const type = point.split("_")[1];

								if (type === "break") {
									took++;
								} else if (type === "skip") {
									skipped++;
								} else if (type === "postpone") {
									postponed++;
								}
							}

							return [took, skipped, postponed];
						})(),
					},
				],
			},
		});
	}
}

// eslint-disable-next-line no-unused-vars
function resetStats() {
	const currentProfile = require("electron").ipcRenderer.sendSync(
		"getCurrentProfile"
	);

	if (
		fs.existsSync(
			path.join(
				app.getPath("userData"),
				currentProfile === "default"
					? "statistics"
					: `${currentProfile}__statistics`
			)
		)
	)
		fs.unlinkSync(
			path.join(
				app.getPath("userData"),
				currentProfile === "default"
					? "statistics"
					: `${currentProfile}__statistics`
			)
		);
	displayStats();
}

displayStats();
