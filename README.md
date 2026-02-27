# ETH Gas Tracker

Chrome extension that shows real-time Ethereum gas prices in your toolbar. Three confidence tiers, EIP-1559 support, color-coded live badge, no API key required.

**Stack:** `Chrome Extension MV3 · Vanilla JS · Blocknative Gas Platform API`

---

## Why I built this

Every time I wanted to send a transaction I was opening a separate tab to check gas. This puts the current gwei estimate one glance away, color-coded on the extension badge so you never have to open anything unless you want the full breakdown.

## Features

- **3 gas tiers** Fast (99%), Standard (90%), Slow (70%) confidence levels
- **EIP-1559 toggle** Switch between legacy gas price and maxFeePerGas
- **Live badge** Current gwei on the extension icon, color-coded green / yellow / orange / red
- **Block progress bar** Visual countdown to next refresh (~13s per Ethereum block)
- **Zero config** No API key, no account, install and go
- **Privacy first** No dataollection, no analytics, no tracking

## Screenshots

![Legacy mode](store/screenshot-1.png)

![EIP-1559 mode](store/screenshot-2.png)

## Install

### From Chrome Web Store

[Install ETH Gas Tracker](https://chromewebstore.google.com/detail/gas-estimator/jhcknfojaophkediapbgihngfnabilmn)

### From Source

1. Clone this repo
2. Open chrome://extensions
3. Enable Developer mode (top right)
4. Click Load unpacked and select the project folder

## File Structure

    background.js        Blocknative API polling, badge updates
    popup.html           Extension popup layout
    popup.js             Popup rendering, toggle, progress bar
    popup.css            Dark theme styles
    manifest.json        Chrome MV3 manifest
    icons/               Extension icons (16, 48, 128px)
    store/               Chrome Web Store assets and store listing copy

## GitHub Topics

`chrome-extension` `ethereum` `gas` `eip1559` `web3` `javascript` `manifest-v3` `blocknative` `crypto`
