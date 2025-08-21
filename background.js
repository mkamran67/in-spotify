let isEnabled = true;

// Load the saved state when the extension starts
browser.storage.local.get("enabled").then((result) => {
	// Default to true if no value is stored yet
	isEnabled = result.enabled !== false;
});

// Listen for messages from the popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "toggleEnabled") {
		isEnabled = request.enabled;
		browser.storage.local.set({ enabled: isEnabled });
	} else if (request.action === "getEnabled") {
		sendResponse({ enabled: isEnabled });
	}
	return true; // Required for async sendResponse
});

function convertToSpotifyURI(url) {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;

		// Matches /track/ID, /album/ID, etc.
		const contentMatch = pathname.match(
			/\/(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/
		);
		if (contentMatch) {
			const type = contentMatch[1];
			const id = contentMatch[2];
			return `spotify:${type}:${id}`;
		}

		// Matches /user/USERNAME/playlist/ID
		const userPlaylistMatch = pathname.match(/\/user\/([^\/]+)\/playlist\/([a-zA-Z0-9]+)/);
		if (userPlaylistMatch) {
			return `spotify:user:${userPlaylistMatch[1]}:playlist:${userPlaylistMatch[2]}`;
		}

		// Matches /user/USERNAME
		const userMatch = pathname.match(/\/user\/([^\/]+)$/);
		if (userMatch) {
			return `spotify:user:${userMatch[1]}`;
		}
	} catch (e) {
		console.error("Invalid URL:", url, e);
	}

	return null;
}

// Intercept Spotify web requests and redirect them
browser.webRequest.onBeforeRequest.addListener(
	function (details) {
		if (!isEnabled || details.type !== "main_frame") {
			return {};
		}

		const spotifyURI = convertToSpotifyURI(details.url);

		if (spotifyURI) {
			// Directly tell the browser to redirect to the Spotify app's URI
			return { redirectUrl: spotifyURI };
		}

		return {};
	},
	{
		urls: ["*://open.spotify.com/*"],
		types: ["main_frame"],
	},
	["blocking"]
);

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (!isEnabled || !tab.title.startsWith("open.spotify.com")) {
		return;
	}

	// Check if browser is done with tab
	if (changeInfo.status === "complete") {
		// Close the tab
		setTimeout(() => {
			browser.tabs.remove(tabId);
		}, 500); // A small delay ensures the OS has time to process the URI
	}
});
