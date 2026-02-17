const BLOCKNATIVE_URL = "https://api.blocknative.com/gasprices/blockprices";
const CONFIDENCE_LEVELS = [99, 90, 70]; // Fast, Standard, Slow

// --- Blocknative Gas API ---

async function fetchBlocknativeGas() {
  const res = await fetch(BLOCKNATIVE_URL);
  if (!res.ok) throw new Error(`Blocknative HTTP ${res.status}`);
  return res.json();
}

// --- Conversion ---

function round2(n) {
  return Math.round(n * 100) / 100;
}

// --- Badge ---

async function updateBadge(baseFeeGwei) {
  const text = baseFeeGwei >= 10000 ? "9999" : baseFeeGwei.toFixed(2);
  await chrome.action.setBadgeText({ text });

  let color;
  if (baseFeeGwei < 20) {
    color = "#4CAF50"; // green
  } else if (baseFeeGwei <= 50) {
    color = "#FFC107"; // yellow
  } else if (baseFeeGwei <= 100) {
    color = "#FF9800"; // orange
  } else {
    color = "#F44336"; // red
  }

  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeTextColor({ color: "#FFFFFF" });
}

// --- Core Fetch ---

async function fetchGasData() {
  try {
    const bnData = await fetchBlocknativeGas();

    // Parse Blocknative response
    const blockPrices = bnData.blockPrices[0];
    const baseFee = round2(blockPrices.baseFeePerGas);
    const estimated = blockPrices.estimatedPrices;

    // Filter to our 3 confidence levels
    const filtered = CONFIDENCE_LEVELS.map((c) =>
      estimated.find((ep) => ep.confidence === c)
    );

    const tiers = filtered.map((ep) => ({
      confidence: ep.confidence,
      maxFeePerGas: round2(ep.maxFeePerGas),
      maxPriorityFeePerGas: round2(ep.maxPriorityFeePerGas),
    }));

    const legacyTiers = filtered.map((ep) => ({
      confidence: ep.confidence,
      price: round2(ep.price),
    }));

    const gasData = {
      baseFee,
      tiers,
      legacyTiers,
      lastUpdated: Date.now(),
      error: null,
    };

    await chrome.storage.local.set({ gasData });
    await updateBadge(legacyTiers[1].price); // Standard (90%) gas price
  } catch (err) {
    // Preserve previous data, just add error
    const prev = await chrome.storage.local.get("gasData");
    const gasData = {
      ...(prev.gasData || {}),
      error: err.message,
      lastUpdated: Date.now(),
    };
    await chrome.storage.local.set({ gasData });

    // Only show ERR badge if we've never had a successful fetch
    if (!prev.gasData || !prev.gasData.baseFee) {
      await chrome.action.setBadgeText({ text: "ERR" });
      await chrome.action.setBadgeBackgroundColor({ color: "#666666" });
    }
  }
}

// --- Polling (every ~13s ≈ 1 Ethereum block) ---

const POLL_INTERVAL = 13_000;

async function poll() {
  await fetchGasData();
  setTimeout(poll, POLL_INTERVAL);
}

// Alarm as safety net — MV3 service workers can be killed, so the
// 30s alarm restarts the setTimeout chain when Chrome wakes us back up.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchGas") poll();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("fetchGas", { periodInMinutes: 0.5 });
  poll();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("fetchGas", { periodInMinutes: 0.5 });
  poll();
});
