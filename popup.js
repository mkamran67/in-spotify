document.addEventListener("DOMContentLoaded", () => {
	const toggle = document.getElementById("toggle");
	const status = document.getElementById("status");

	// Update UI based on state
	function updateUI(enabled) {
		if (enabled) {
			toggle.classList.add("active");
			status.className = "status enabled";
			status.textContent = "Extension is active";
		} else {
			toggle.classList.remove("active");
			status.className = "status disabled";
			status.textContent = "Extension is disabled";
		}
	}

	// Get current state from background script
	browser.runtime.sendMessage({ action: "getEnabled" }).then((response) => {
		updateUI(response.enabled);
	});

	// Handle toggle click
	toggle.addEventListener("click", () => {
		const isActive = toggle.classList.contains("active");
		const newState = !isActive;

		// Update UI immediately for responsiveness
		updateUI(newState);

		// Send message to background script to update state
		browser.runtime.sendMessage({
			action: "toggleEnabled",
			enabled: newState,
		});
	});
});
