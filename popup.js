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
    if (currentData) {
      renderData(currentData, mode);
      const badgeValue = mode
        ? currentData.tiers[1].maxFeePerGas
        : currentData.legacyTiers[1].price;
      chrome.runtime.sendMessage({ type: "updateBadge", value: badgeValue });
    }
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
    const container = document.getElementById(`tier${i}Values`);
    if (isEip1559 && data.tiers) {
      container.innerHTML = `
        <div class="tier-fee-row">
          <span class="tier-fee-label">Priority</span>
          <span class="tier-fee-value">${data.tiers[i].maxPriorityFeePerGas.toFixed(2)}</span>
        </div>
        <div class="tier-fee-row">
          <span class="tier-fee-label">Max Fee</span>
          <span class="tier-fee-value">${data.tiers[i].maxFeePerGas.toFixed(2)}</span>
        </div>
        <div class="tier-unit">GWEI</div>`;
    } else if (data.legacyTiers) {
      container.innerHTML = `
        <div class="tier-gwei">${formatGwei(data.legacyTiers[i].price)}</div>
        <div class="tier-unit">GWEI</div>`;
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
