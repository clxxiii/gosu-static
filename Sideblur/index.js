let queryString = window.location.search;
queryString = queryString.replace("?", "");
let queries = {};
let params = queryString.split("&");
for (const param of params) {
	let keyValue = param.split("=");
	queries[keyValue[0]] = keyValue[1];
}

let socket = new ReconnectingWebSocket(`ws://${location.host}/ws`);
socket.onopen = () => console.log("Successfully Connected");
socket.onclose = (event) => {
	console.log("Socket Closed Connection: ", event);
	socket.send("Client Closed!");
};
socket.onerror = (error) => console.log("Socket Error: ", error);

let bgs = document.getElementsByClassName("bg");
let ov = document.getElementById("overlay");
let error = document.getElementById("error");
let size = document.getElementById("size");
let metadata = document.getElementById("metadata");
let metadataString = document.getElementById("metadata-string");
let metadataMapId = document.getElementById("metadata-map-id");
let metadataMap = document.getElementById("metadata-map");
let metadataStars = document.getElementById("metadata-stars");
let metadataCSAR = document.getElementById("metadata-csar");
let metadataODHP = document.getElementById("metadata-odhp");
let metadataBPM = document.getElementById("metadata-bpm");
let hits = document.getElementById("hits");
let hits0 = document.getElementById("hits0");
let hits50 = document.getElementById("hits50");
let hits100 = document.getElementById("hits100");
let ppString = document.getElementById("pp");
let grade = document.getElementById("grade");

let statesEnum = {
	0: "MainMenu",
	1: "EditingMap",
	2: "Playing",
	3: "GameShutdownAnimation",
	4: "SongSelectEdit",
	5: "SongSelect",
	6: "WIP_NoIdeaWhatThisIs",
	7: "ResultsScreen",
	10: "GameStartupAnimation",
	11: "MultiplayerRooms",
	12: "MultiplayerRoom",
	13: "MultiplayerSongSelect",
	14: "MultiplayerResultsscreen",
	15: "OsuDirect",
	17: "RankingTagCoop",
	18: "RankingTeam",
	19: "ProcessingBeatmaps",
	22: "Tourney",
};

let temp = {
	state: null,
	bg: null,
	id: null,
	sr: null,
	ur: null,
	hits: {
		0: null,
		50: null,
		100: null,
	},
	pp: null,
	grade: null,
};

let od = new Odometer({
	el: metadataMapId,
	value: 1000000,
	format: "d",
});

let pp = new Odometer({
	el: ppString,
	value: 0,
	format: "(d).dd",
});

if (queries?.side?.match(/top|left|right|bottom|none/)) {
	metadata.classList.add(queries.side);
	ov.classList.add("ov-" + queries.side);
} else {
	metadata.classList.add("top");
	ov.classList.add("ov-top");
}

let properties = getComputedStyle(metadata);

let totalWidth =
	parseInt(properties.getPropertyValue("--width").replace("px", "")) +
	2 * parseInt(properties.getPropertyValue("--box-shadow").replace("px", ""));
let totalHeight =
	parseInt(properties.getPropertyValue("--height").replace("px", "")) +
	2 * parseInt(properties.getPropertyValue("--box-shadow").replace("px", ""));
size.innerHTML = `Please set browser source dimensions to ${totalWidth}x${totalHeight}`;
let windowSize = size.getBoundingClientRect();
if (windowSize.width != totalWidth || windowSize.height != totalHeight) {
	ov.style.opacity = 0;
	size.style.opacity = 1;
	setTimeout(() => {
		ov.style.opacity = 1;
		size.style.opacity = 0;
		resolve;
	}, 5000);
}

socket.onmessage = (event) => {
	setTimeout(() => {
		metadata.style.opacity = 1;
		error.style.opacity = 0;
	}, 1000);
	try {
		let data = JSON.parse(event.data);
		if (temp.id != data.menu.bm.id) {
			temp.id = data.menu.bm.id;
			let { artist, title, difficulty } = data.menu.bm.metadata;
			metadataString.textContent = `${artist} - ${title} [${difficulty}]`;

			metadataMapId.textContent = temp.id;
		}

		if (
			temp.sr != data.menu.bm.stats.fullSR ||
			temp.id != data.menu.bm.id
		) {
			temp.sr = data.menu.bm.stats.fullSR;
			let { CS, AR, OD, HP, fullSR, BPM } = data.menu.bm.stats;

			metadataStars.textContent = `${fullSR.toFixed(2)}☆`;
			metadataCSAR.textContent = `CS${CS.toFixed(1)} AR${AR.toFixed(1)}`;
			metadataODHP.textContent = `OD${OD.toFixed(1)} HP${HP.toFixed(1)}`;
			metadataBPM.textContent = `BPM: ${BPM.max}`;
		}

		if (temp.bg != data.menu.bm.path.full) {
			temp.bg = data.menu.bm.path.full;
			let img = data.menu.bm.path.full
				.replace(/#/g, "%23")
				.replace(/%/g, "%25");
			for (const bg of bgs) {
				bg.setAttribute(
					"src",
					`http://${location.host}/Songs/${img}?a=${Math.random(
						10000
					)}`
				);
			}
		}

		if (temp.hits[0] != data.gameplay.hits[0]) {
			temp.hits[0] = data.gameplay.hits[0];
			hits0.textContent = temp.hits[0];
		}

		if (temp.hits[50] != data.gameplay.hits[50]) {
			temp.hits[50] = data.gameplay.hits[50];
			hits50.textContent = temp.hits[50];
		}

		if (temp.hits[100] != data.gameplay.hits[100]) {
			temp.hits[100] = data.gameplay.hits[100];
			hits100.textContent = temp.hits[100];
		}

		if (temp.pp != data.gameplay.pp.current) {
			temp.pp = data.gameplay.pp.current;
			ppString.textContent = data.gameplay.pp.current;
		}

		if (temp.grade != data.gameplay.hits.grade.current) {
			temp.grade = data.gameplay.hits.grade.current;
			if (
				data.menu.mods.str.includes("HD") ||
				data.menu.mods.str.includes("FL")
			) {
				hdfl = true;
			} else hdfl = false;

			if (data.gameplay.hits.grade.current === "") {
				grade.textContent = "SS";
			} else grade.textContent = data.gameplay.hits.grade.current;

			if (grade.textContent == "SS") {
				if (hdfl == true) {
					grade.style.color = properties.getPropertyValue("--HDS");
				} else {
					grade.style.color = properties.getPropertyValue("--S");
				}
			} else if (grade.textContent == "S") {
				if (hdfl == true) {
					grade.style.color = properties.getPropertyValue("--HDS");
				} else {
					grade.style.color = properties.getPropertyValue("--S");
				}
			} else if (grade.textContent == "A") {
				grade.style.color = properties.getPropertyValue("--A");
			} else if (grade.textContent == "B") {
				grade.style.color = properties.getPropertyValue("--B");
			} else if (grade.textContent == "C") {
				grade.style.color = properties.getPropertyValue("--C");
			} else {
				grade.style.color = properties.getPropertyValue("--D");
			}
		}

		if (temp.state != data.menu.state) {
			let newState = data.menu.state;
			let oldState = temp.state;

			let mapLength = metadataMap.getBoundingClientRect().width;
			let mapTransformX = `calc(-1 * (var(--width) / 2) + (${mapLength}px / 2) +  var(--box-margin))`;
			let mapTransformY = `calc(var(--height) / 2 - (2 * var(--box-margin)))`;

			// Add middle animation on the following transitions:
			let middle = false;
			middle = middle || (oldState == 2 && newState == 5);
			middle = middle || (oldState == 5 && newState == 2);
			middle = middle || (oldState == 7 && newState == 5);
			middle = middle || (oldState == 12 && newState == 13);
			middle = middle || (oldState == 13 && newState == 12);

			if (middle) {
				metadataMap.style.transform = `translate(${mapTransformX}, 0%)`;
			}

			// Don't animate transition from select to results
			if (oldState == 5 && newState == 7) {
				return;
			}

			if (newState == 2 || newState == 7 || newState == 14) {
				// Stage 1 of transition
				metadata.style.width = properties.getPropertyValue("--width");

				// Stage 2 of transition
				setTimeout(() => {
					hits.style.transform = "translateY(0px)";
					metadata.style.height =
						properties.getPropertyValue("--height");
					metadataMap.style.transform = `translate(${mapTransformX}, ${mapTransformY})`;
				}, 500);

				// Add over class to title if needed
				let width = parseInt(
					properties.getPropertyValue("--width").replace("px", "")
				);
				let boxMargin = parseInt(
					properties
						.getPropertyValue("--box-margin")
						.replace("px", "")
				);
				let stringMaxWidth = width + 2 * boxMargin;
				if (
					metadataString.getBoundingClientRect().width >=
					stringMaxWidth
				) {
					metadataString.classList.add("over");
				} else {
					metadataString.classList.remove("over");
				}
			} else {
				// Stage 1 of transition
				metadata.style.height =
					properties.getPropertyValue("--small-height");
				metadataString.classList.remove("over");
				hits.style.transform = "translateY(125%)";

				// Stage 2 of transition
				setTimeout(() => {
					metadata.style.width =
						properties.getPropertyValue("--small-width");
					metadataMap.style.transform = "translate(0px, 0px)";
				}, 500);
			}

			if (newState == 7 || newState == 14) {
				ppString.style.color = "#AAFFAA";
				ppString.style.transform = "translateX(-10px) scale(1.2)";
			} else if (newState == 2) {
				ppString.style.color = "#FFFFFF";
				ppString.style.transform = "translateX(0px) scale(1)";
			} else {
				ppString.style.color = "#FFFFFF";
				ppString.style.transform = "translateX(0px) scale(1)";
			}

			temp.state = data.menu.state;
		}
	} catch (err) {
		metadata.style.opacity = 0;
		error.style.opacity = 1;
		console.log(err);
	}
};
