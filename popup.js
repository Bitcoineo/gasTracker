let currentData = null;
let updateTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("eip1559Toggle");

  // Load toggle state
  const { eip1559Mode } = await chrome.storage.local.get("eip1559Mode");
  const isEip1559 = eip1559Mode === true;
  toggle.checked = isEip1559;

  // Load gas data
  const { gasData } = await chrome.storage.local.get("gasData");
  if (gasData) {
    currentData = gasData;
    renderData(gasData, isEip1559);
    restartBlockFill();
    startUpdateTimer();
  }

  // Toggle change
  toggle.addEventListener("change", async (e) => {
    const mode = e.target.checked;
    await chrome.storage.local.set({ eip1559Mode: mode });
    if (currentData) renderData(currentData, mode);
  });

  // Live updates from background
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.gasData) {
      currentData = changes.gasData.newValue;
      const isOn = document.getElementById("eip1559Toggle").checked;
      renderData(currentData, isOn);
      restartBlockFill();
      startUpdateTimer();
    }
  });
});

function renderData(data, isEip1559) {
  const errorEl = document.getElementById("errorMsg");

  if (data.error && !data.baseFee) {
    errorEl.textContent = data.error;
    errorEl.classList.remove("hidden");
    return;
  }

  if (data.error) {
    errorEl.textContent = data.error;
    errorEl.classList.remove("hidden");
  } else {
    errorEl.classList.add("hidden");
  }

  // Populate 3 tier cards
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById(`tier${i}Gwei`);
    if (isEip1559 && data.tiers) {
      el.textContent = formatGwei(data.tiers[i].maxFeePerGas);
    } else if (data.legacyTiers) {
      el.textContent = formatGwei(data.legacyTiers[i].price);
    }
  }
}

function formatGwei(value) {
  if (value >= 10) return Math.round(value).toString();
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

function restartBlockFill() {
  const fill = document.getElementById("blockFill");
  fill.style.animation = "none";
  fill.offsetHeight; // trigger reflow to reset
  fill.style.animation = "";
}

function startUpdateTimer() {
  if (updateTimer) clearInterval(updateTimer);
  updateSecondsAgo();
  updateTimer = setInterval(updateSecondsAgo, 1000);
}

function updateSecondsAgo() {
  if (!currentData || !currentData.lastUpdated) return;
  const seconds = Math.floor((Date.now() - currentData.lastUpdated) / 1000);
  document.getElementById("updateAgo").textContent = `${seconds}s`;
}
