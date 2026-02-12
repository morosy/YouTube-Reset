(() => {
    'use strict';

    const STORAGE = chrome.storage.local;

    const STORAGE_DEFAULTS = {
        enabled: true
    };

    const buildIconPaths = (enabled) => {
        const prefix = enabled ? 'icon_on' : 'icon_off';

        return {
            16: chrome.runtime.getURL(`assets/icon/${prefix}16.png`),
            48: chrome.runtime.getURL(`assets/icon/${prefix}48.png`),
            128: chrome.runtime.getURL(`assets/icon/${prefix}128.png`)
        };
    };

    const setActionAppearance = async (enabled) => {
        await chrome.action.setIcon({
            path: buildIconPaths(enabled)
        });

        await chrome.action.setBadgeText({
            text: enabled ? 'ON' : 'OFF'
        });

        await chrome.action.setBadgeBackgroundColor({
            color: enabled ? '#d32f2f' : '#666666'
        });
    };

    const applyFromStorage = async () => {
        try {
            const data = await STORAGE.get(STORAGE_DEFAULTS);
            await setActionAppearance(!!data.enabled);
        } catch (e) {
            await setActionAppearance(true);
        }
    };

    chrome.runtime.onInstalled.addListener(() => {
        applyFromStorage();
    });

    chrome.runtime.onStartup.addListener(() => {
        applyFromStorage();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') {
            return;
        }
        if (!changes.enabled) {
            return;
        }
        setActionAppearance(!!changes.enabled.newValue);
    });

    applyFromStorage();
})();
