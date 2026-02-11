(() => {
    'use strict';

    const DEFAULTS = {
        enabled: true,
        showToast: true,
        toastPosition: 'center',
        toastScale: 1.0,
        toastDurationMs: 2000,
        toastBgColor: '#141414',
        toastTextColor: '#ffffff'
    };

    const BG_PRESETS = [
        '#141414',
        '#1f2937',
        '#0f766e',
        '#7c3aed',
        '#b91c1c'
    ];

    const FG_PRESETS = [
        '#ffffff',
        '#e5e7eb',
        '#111827',
        '#0b0f19',
        '#facc15'
    ];

    const TOAST_ID = 'ytr-options-toast';

    const els = {
        enabled: document.getElementById('enabled'),
        settingsBody: document.getElementById('settingsBody'),

        showToast: document.getElementById('showToast'),
        toastDetails: document.getElementById('toastDetails'),

        toastPosition: document.getElementById('toastPosition'),
        toastScale: document.getElementById('toastScale'),
        toastScaleValue: document.getElementById('toastScaleValue'),

        toastDuration: document.getElementById('toastDuration'),
        toastDurationInput: document.getElementById('toastDurationInput'),

        bgPresets: document.getElementById('bgPresets'),
        fgPresets: document.getElementById('fgPresets'),
        toastBgColor: document.getElementById('toastBgColor'),
        toastTextColor: document.getElementById('toastTextColor'),
        toastBgColorValue: document.getElementById('toastBgColorValue'),
        toastTextColorValue: document.getElementById('toastTextColorValue'),

        previewToast: document.getElementById('previewToast'),
        saveSettings: document.getElementById('saveSettings'),
        unsavedDot: document.getElementById('unsavedDot')
    };

    let saveToastTimerId = null;

    // ロード直後は未保存ではない
    let hasLoaded = false;
    let isDirty = false;

    const clampInt = (v, min, max) => {
        const n = Number.parseInt(v, 10);
        if (Number.isNaN(n)) {
            return min;
        }
        return Math.min(max, Math.max(min, n));
    };

    const clampFloat = (v, min, max) => {
        const n = Number.parseFloat(v);
        if (Number.isNaN(n)) {
            return min;
        }
        return Math.min(max, Math.max(min, n));
    };

    const isValidHexColor = (value) => {
        return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
    };

    const setDirty = (dirty) => {
        isDirty = dirty;

        if (!hasLoaded) {
            els.unsavedDot.classList.remove('is-visible');
            return;
        }

        if (isDirty) {
            els.unsavedDot.classList.add('is-visible');
            return;
        }

        els.unsavedDot.classList.remove('is-visible');
    };

    const updateEnabledLook = () => {
        if (!els.enabled.checked) {
            els.settingsBody.classList.add('is-disabled-look');
            return;
        }
        els.settingsBody.classList.remove('is-disabled-look');
    };

    const updateDetailsVisibility = () => {
        els.toastDetails.style.display = els.showToast.checked ? 'block' : 'none';
    };

    const updateScaleLabel = () => {
        els.toastScaleValue.textContent = `${Number(els.toastScale.value).toFixed(2)}x`;
    };

    const updateColorLabels = () => {
        els.toastBgColorValue.textContent = els.toastBgColor.value.toUpperCase();
        els.toastTextColorValue.textContent = els.toastTextColor.value.toUpperCase();
    };

    const ensureSaveToastElement = () => {
        let el = document.getElementById(TOAST_ID);
        if (el) {
            return el;
        }

        el = document.createElement('div');
        el.id = TOAST_ID;
        el.className = 'ytr-toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');

        el.style.left = '50%';
        el.style.right = 'auto';
        el.style.setProperty('--ytr-x', '-50%');
        el.style.setProperty('--ytr-scale', '1');

        el.style.setProperty('--ytr-bg', 'rgba(20, 20, 20, 0.92)');
        el.style.setProperty('--ytr-fg', '#ffffff');

        document.documentElement.appendChild(el);
        return el;
    };

    const showSaveToast = () => {
        const el = ensureSaveToastElement();
        el.textContent = '設定を保存しました';
        el.classList.add('ytr-toast--show');

        if (saveToastTimerId !== null) {
            clearTimeout(saveToastTimerId);
        }

        saveToastTimerId = window.setTimeout(() => {
            el.classList.remove('ytr-toast--show');
            saveToastTimerId = null;
        }, 1400);
    };

    const renderPresetButtons = (containerEl, colors, onPick) => {
        containerEl.innerHTML = '';

        for (const color of colors) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'preset-btn';
            btn.setAttribute('aria-label', color);
            btn.style.background = color;

            btn.addEventListener('click', () => {
                onPick(color);
            });

            containerEl.appendChild(btn);
        }
    };

    const collectPayloadFromUi = () => {
        const seconds = clampInt(els.toastDuration.value, 1, 10);

        const bg = isValidHexColor(els.toastBgColor.value) ? els.toastBgColor.value : DEFAULTS.toastBgColor;
        const fg = isValidHexColor(els.toastTextColor.value) ? els.toastTextColor.value : DEFAULTS.toastTextColor;

        return {
            enabled: els.enabled.checked,
            showToast: els.showToast.checked,
            toastPosition: els.toastPosition.value,
            toastScale: clampFloat(els.toastScale.value, 0.8, 1.5),
            toastDurationMs: seconds * 1000,
            toastBgColor: bg,
            toastTextColor: fg
        };
    };

    const applyDurationInputToRange = () => {
        const seconds = clampInt(els.toastDurationInput.value, 1, 10);
        els.toastDurationInput.value = String(seconds);
        els.toastDuration.value = String(seconds);
    };

    const applyRangeToDurationInput = () => {
        els.toastDurationInput.value = String(els.toastDuration.value);
    };

    const createPreviewToast = (settings) => {
        const toast = document.createElement('div');
        toast.className = 'ytr-toast';
        toast.textContent = 'プレビュー表示';

        if (settings.toastPosition === 'left') {
            toast.style.left = '18px';
            toast.style.right = 'auto';
            toast.style.setProperty('--ytr-x', '0%');
        } else if (settings.toastPosition === 'right') {
            toast.style.left = 'auto';
            toast.style.right = '18px';
            toast.style.setProperty('--ytr-x', '0%');
        } else {
            toast.style.left = '50%';
            toast.style.right = 'auto';
            toast.style.setProperty('--ytr-x', '-50%');
        }

        toast.style.setProperty('--ytr-scale', String(settings.toastScale));
        toast.style.setProperty('--ytr-bg', settings.toastBgColor);
        toast.style.setProperty('--ytr-fg', settings.toastTextColor);

        document.documentElement.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('ytr-toast--show');
        });

        window.setTimeout(() => {
            toast.classList.remove('ytr-toast--show');
            window.setTimeout(() => toast.remove(), 220);
        }, settings.toastDurationMs);
    };

    const markDirtyByUserAction = () => {
        if (!hasLoaded) {
            return;
        }
        setDirty(true);
    };

    const load = async () => {
        const data = await chrome.storage.sync.get(DEFAULTS);

        els.enabled.checked = data.enabled;
        updateEnabledLook();

        els.showToast.checked = data.showToast;
        updateDetailsVisibility();

        els.toastPosition.value = data.toastPosition;

        els.toastScale.value = String(clampFloat(data.toastScale, 0.8, 1.5));
        updateScaleLabel();

        const seconds = clampInt(Math.round(clampInt(data.toastDurationMs, 1000, 10000) / 1000), 1, 10);
        els.toastDuration.value = String(seconds);
        els.toastDurationInput.value = String(seconds);

        els.toastBgColor.value = isValidHexColor(data.toastBgColor) ? data.toastBgColor : DEFAULTS.toastBgColor;
        els.toastTextColor.value = isValidHexColor(data.toastTextColor) ? data.toastTextColor : DEFAULTS.toastTextColor;
        updateColorLabels();

        renderPresetButtons(els.bgPresets, BG_PRESETS, (color) => {
            els.toastBgColor.value = color;
            updateColorLabels();
            markDirtyByUserAction();
        });

        renderPresetButtons(els.fgPresets, FG_PRESETS, (color) => {
            els.toastTextColor.value = color;
            updateColorLabels();
            markDirtyByUserAction();
        });

        hasLoaded = true;
        setDirty(false);
    };

    // UIイベント：変更時に未保存 표시（保存はボタンのみ）
    els.enabled.addEventListener('change', () => {
        updateEnabledLook();
        markDirtyByUserAction();
    });

    els.showToast.addEventListener('change', () => {
        updateDetailsVisibility();
        markDirtyByUserAction();
    });

    els.toastPosition.addEventListener('change', markDirtyByUserAction);

    els.toastScale.addEventListener('input', () => {
        updateScaleLabel();
        markDirtyByUserAction();
    });

    els.toastDuration.addEventListener('input', () => {
        applyRangeToDurationInput();
        markDirtyByUserAction();
    });

    els.toastDurationInput.addEventListener('input', () => {
        applyDurationInputToRange();
        markDirtyByUserAction();
    });

    els.toastBgColor.addEventListener('input', () => {
        updateColorLabels();
        markDirtyByUserAction();
    });

    els.toastTextColor.addEventListener('input', () => {
        updateColorLabels();
        markDirtyByUserAction();
    });

    els.previewToast.addEventListener('click', () => {
        const payload = collectPayloadFromUi();
        createPreviewToast(payload);
    });

    els.saveSettings.addEventListener('click', async () => {
        const payload = collectPayloadFromUi();
        await chrome.storage.sync.set(payload);
        showSaveToast();
        setDirty(false);
    });

    load();
})();
