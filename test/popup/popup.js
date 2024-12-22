// Initialize settings object and error tracking
var settings = {};
var errorCount = 0;
const MAX_ERRORS = 3;
const ERROR_RESET_TIME = 60000; // 1 minute

const refreshableSettings = [
    "blurImages",
    "blurVideos",
    "blurMale",
    "blurFemale",
    "unblurImages",
    "unblurVideos",
    "blurryStartMode",
    "strictness",
    "specificBlur",
    "whitelist",
];

const allSettings = ["blurAmount", "gray", ...refreshableSettings];

var currentWebsite, refreshMessage, container;

// Initialize popup with error handling

// Initialize core functionality
const initCalls = async () => {
    try {
        const browserLang = navigator.language?.split("-")[0] ?? "en";
        setLanguage(settings.language ?? browserLang);
        displaySettings(settings);
        addListeners();
    } catch (error) {
        handleError("Failed to initialize core functionality", error);
    }
};
async function initPopup() {
    try {
        await loadLocalSettings();

        if (
            document.readyState === "complete" ||
            document.readyState === "interactive"
        ) {
            initCalls();
        } else {
            document.addEventListener("DOMContentLoaded", initCalls);
        }

        await getCurrentWebsite();
        displayWhiteList();
    } catch (error) {
        handleError("Failed to initialize popup", error);
        showErrorToUser(
            "Failed to initialize. Please try reopening the popup."
        );
    }
}

// Load settings from storage with validation
function loadLocalSettings() {
    return new Promise((resolve) => {
        browser.storage.sync.get(["hb-settings"], function (storage) {
            if (browser.runtime.lastError) {
                console.error(
                    "Error loading settings:",
                    browser.runtime.lastError
                );
                settings = {}; // Set empty settings on error
                resolve();
                return;
            }
            settings = storage["hb-settings"];
            resolve();
        });
    });
}
// Validate settings object
function validateSettings(settings) {
    const requiredSettings = [
        "status",
        "blurAmount",
        "blurImages",
        "blurVideos",
        "whitelist",
    ];

    for (const setting of requiredSettings) {
        if (settings[setting] === undefined) {
            throw new Error(`Missing required setting: ${setting}`);
        }
    }
}

// Update current website handling
function getCurrentWebsite() {
    return new Promise((resolve) => {
        browser.tabs?.query(
            { active: true, currentWindow: true },
            function (tabs) {
                if (!tabs[0]) {
                    resolve();
                    return;
                }

                try {
                    browser.tabs.sendMessage(
                        tabs[0].id,
                        { type: "getCurrentWebsite" },
                        function (response) {
                            if (browser.runtime.lastError) {
                                console.log(
                                    "Error getting website:",
                                    browser.runtime.lastError
                                );
                                resolve(null);
                                return;
                            }
                            currentWebsite =
                                response?.currentWebsite?.split("www.")?.[1] ??
                                response?.currentWebsite ??
                                null;
                            resolve();
                        }
                    );
                } catch (error) {
                    console.error("Error in getCurrentWebsite:", error);
                    resolve(null);
                }
            }
        );
    });
}

// Safe element update function
function safeUpdateElement(selector, updateFn) {
    const element = document.querySelector(selector);
    if (element) {
        try {
            updateFn(element);
        } catch (error) {
            handleError(`Failed to update element: ${selector}`, error);
        }
    }
}

// Display settings with error handling
function displaySettings(settings) {
    try {
        console.log("display settings", settings);

        safeUpdateElement(
            "input[name=status]",
            (el) => (el.checked = settings.status)
        );
        safeUpdateElement(
            "input[name=blurryStartMode]",
            (el) => (el.checked = settings.blurryStartMode)
        );
        safeUpdateElement(
            "input[name=blurAmount]",
            (el) => (el.value = settings.blurAmount)
        );
        safeUpdateElement(
            "#blur-amount-value",
            (el) => (el.innerHTML = `${settings.blurAmount}%`)
        );
        safeUpdateElement(
            "input[name=gray]",
            (el) => (el.checked = settings.gray ?? true)
        );
        safeUpdateElement(
            "input[name=strictness]",
            (el) => (el.value = +settings.strictness)
        );
        safeUpdateElement(
            "#strictness-value",
            (el) => (el.innerHTML = +settings.strictness * 100 + "%")
        );

        const specificBlurInputs = document.querySelectorAll(
            'input[name="specificBlur"]'
        );
        specificBlurInputs.forEach((input) => {
            input.checked = input.value === String(settings.specificBlur);
        });

        safeUpdateElement(
            "input[name=blurImages]",
            (el) => (el.checked = settings.blurImages)
        );
        safeUpdateElement(
            "input[name=blurVideos]",
            (el) => (el.checked = settings.blurVideos)
        );
        safeUpdateElement(
            "input[name=blurMale]",
            (el) => (el.checked = settings.blurMale)
        );
        safeUpdateElement(
            "input[name=blurFemale]",
            (el) => (el.checked = settings.blurFemale)
        );
        safeUpdateElement(
            "input[name=unblurImages]",
            (el) => (el.checked = settings.unblurImages)
        );
        safeUpdateElement(
            "input[name=unblurVideos]",
            (el) => (el.checked = settings.unblurVideos)
        );
        safeUpdateElement("#language", (el) => (el.value = settings.language));

        refreshMessage = document.querySelector("#refresh-message");
        container = document.querySelector("#container");
        toggleAllInputs();
    } catch (error) {
        handleError("Failed to display settings", error);
    }
}

// Add event listeners with error handling
function addListeners() {
    try {
        const addSafeListener = (selector, event, handler) => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener(event, async (e) => {
                    try {
                        await handler(e);
                    } catch (error) {
                        handleError(
                            `Error in ${event} listener for ${selector}`,
                            error
                        );
                    }
                });
            }
        };

        addSafeListener("input[name=status]", "change", updateStatus);
        addSafeListener(
            "input[name=blurryStartMode]",
            "change",
            updateCheckbox("blurryStartMode")
        );
        addSafeListener(
            "input[name=blurImages]",
            "change",
            updateCheckbox("blurImages")
        );
        addSafeListener(
            "input[name=blurVideos]",
            "change",
            updateCheckbox("blurVideos")
        );
        addSafeListener(
            "input[name=blurMale]",
            "change",
            updateCheckbox("blurMale")
        );
        addSafeListener(
            "input[name=blurFemale]",
            "change",
            updateCheckbox("blurFemale")
        );
        addSafeListener("input[name=blurAmount]", "change", updateBlurAmount);
        addSafeListener("input[name=gray]", "change", updateCheckbox("gray"));
        addSafeListener("input[name=strictness]", "change", updateStrictness);

        document
            .querySelectorAll('input[name="specificBlur"]')
            .forEach((input) => {
                input.addEventListener("change", updateSpecificBlur);
            });

        addSafeListener(
            "input[name=unblurImages]",
            "change",
            updateCheckbox("unblurImages")
        );
        addSafeListener(
            "input[name=unblurVideos]",
            "change",
            updateCheckbox("unblurVideos")
        );
        addSafeListener("#language", "change", function () {
            setLanguage(document.querySelector("#language").value);
        });
        addSafeListener("#whitelist", "change", updateWhitelist);
    } catch (error) {
        handleError("Failed to add listeners", error);
    }
}

// Update settings in storage with retry
async function updateSettingsInStorage() {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await browser.storage.sync.set({ "hb-settings": settings });
            return true;
        } catch (error) {
            retries++;
            if (retries === maxRetries) {
                handleError("Failed to update settings in storage", error);
                return false;
            }
            await new Promise((resolve) => setTimeout(resolve, 100 * retries));
        }
    }
}

// Send settings update to tabs with error handling
async function sendUpdatedSettings(key) {
    try {
        // First update storage
        browser.storage.sync
            .set({ "hb-settings": settings })
            .then(() => {
                const message = {
                    type: "updateSettings",
                    newSetting: {
                        key: key,
                        value: settings[key],
                    },
                };

                // Send to background script - don't wait for response
                browser.runtime.sendMessage(message);

                // Send to active tab - don't wait for response
                browser.tabs.query(
                    { currentWindow: true, active: true },
                    function (tabs) {
                        const activeTab = tabs[0];
                        if (!activeTab) return;
                        browser.tabs.sendMessage(activeTab.id, message);
                    }
                );
            })
            .catch((error) => {
                handleError("Failed to save settings to storage", error);
                showErrorToUser("Failed to save settings. Please try again.");
            });
    } catch (error) {
        handleError("Failed to send updated settings", error);
        showErrorToUser("Failed to save settings. Please try again.");
    }
}

// Error handling and user feedback
function handleError(context, error) {
    console.error(`HaramBlur Error: ${context}`, error);
    errorCount++;

    if (errorCount >= MAX_ERRORS) {
        setTimeout(() => {
            errorCount = 0;
        }, ERROR_RESET_TIME);

        // browser.runtime.sendMessage({
        //     type: "reloadExtension"
        // });
    }
}
// Simple error display helper
function showErrorToUser(message) {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ff4444;
        color: white;
        padding: 10px;
        border-radius: 4px;
        z-index: 1000;
        text-align: center;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Display whitelist UI with error handling
function displayWhiteList(skipSet = false) {
    try {
        const whiteListContainer = document.getElementById(
            "whitelist-container"
        );
        const whiteList = document.getElementById("whitelist");
        const websiteName = document.getElementById("website-name");
        const whiteListStatusOn = document.getElementById(
            "whitelist-status-on"
        );
        const whiteListStatusOff = document.getElementById(
            "whitelist-status-off"
        );

        if (
            !whiteListContainer ||
            !whiteList ||
            !websiteName ||
            !whiteListStatusOn ||
            !whiteListStatusOff
        ) {
            throw new Error("Required whitelist elements not found");
        }

        if (!currentWebsite) {
            whiteListContainer.classList.add("hidden");
            return;
        } else {
            whiteListContainer.classList.remove("hidden");
        }

        if (!skipSet) {
            websiteName.innerHTML = currentWebsite;
            whiteList.checked = !settings.whitelist.includes(currentWebsite);
        }

        if (whiteList.checked) {
            whiteListStatusOn.classList.remove("hidden");
            whiteListStatusOff.classList.add("hidden");
        } else {
            whiteListStatusOn.classList.add("hidden");
            whiteListStatusOff.classList.remove("hidden");
        }
    } catch (error) {
        handleError("Failed to display whitelist", error);
    }
}

function updateStatus() {
    try {
        settings.status = document.querySelector("input[name=status]").checked;
        toggleAllInputs();
        sendUpdatedSettings("status");
        showRefreshMessage("status");
    } catch (error) {
        handleError("Failed to update status", error);
        // Revert the checkbox if there was an error
        const statusCheckbox = document.querySelector("input[name=status]");
        if (statusCheckbox) {
            statusCheckbox.checked = !statusCheckbox.checked;
        }
        showErrorToUser("Failed to update status. Please try again.");
    }
}

function updateBlurAmount() {
    try {
        const input = document.querySelector("input[name=blurAmount]");
        settings.blurAmount = input.value;

        safeUpdateElement(
            "#blur-amount-value",
            (el) => (el.innerHTML = settings.blurAmount + "%")
        );

        sendUpdatedSettings("blurAmount");
        showRefreshMessage("blurAmount");
    } catch (error) {
        handleError("Failed to update blur amount", error);
    }
}

function updateStrictness() {
    try {
        settings.strictness = document.querySelector(
            "input[name=strictness]"
        ).value;

        safeUpdateElement(
            "#strictness-value",
            (el) => (el.innerHTML = +settings.strictness * 100 + "%")
        );

        sendUpdatedSettings("strictness");
        showRefreshMessage("strictness");
    } catch (error) {
        handleError("Failed to update strictness", error);
    }
}

function updateCheckbox(key) {
    return function () {
        try {
            settings[key] = document.querySelector(
                `input[name=${key}]`
            ).checked;
            sendUpdatedSettings(key);
            showRefreshMessage(key);
        } catch (error) {
            handleError(`Failed to update checkbox: ${key}`, error);
        }
    };
}

// Keep existing helper functions but add basic error handling
function toggleAllInputs() {
    try {
        if (container) {
            container.style.opacity = settings.status ? 1 : 0.5;
        }
        allSettings.forEach(function (setting) {
            const input = document.querySelector(`input[name=${setting}]`);
            if (input) {
                input.disabled = !settings.status;
            }
        });
    } catch (error) {
        handleError("Failed to toggle inputs", error);
    }
}

// Set language with error handling
function setLanguage(lang) {
    try {
        if (!lang || typeof lang !== "string") {
            throw new Error("Invalid language provided");
        }

        document.body.lang = lang;
        const container = document.getElementById("container");
        if (!container) {
            throw new Error("Container element not found");
        }

        container.dir = HB_TRANSLATIONS_DIR[lang];

        const translations = getTranslations(settings)?.[lang];
        if (!translations) {
            throw new Error(`Translations not found for language: ${lang}`);
        }

        const keys = Object.keys(translations);
        keys.forEach((key) => {
            const elements = document.querySelectorAll(key);
            elements.forEach((element) => {
                element.innerHTML = translations[key];
                if (HB_TRANSLATIONS_DIR[lang]) {
                    element.dir = HB_TRANSLATIONS_DIR[lang];
                }
            });
        });

        settings.language = lang;
        updateSettingsInStorage().catch((error) => {
            handleError("Failed to save language setting", error);
        });
    } catch (error) {
        handleError("Failed to set language", error);
        showErrorToUser("Failed to change language. Please try again.");
    }
}

// Update whitelist with error handling
function updateWhitelist(e) {
    try {
        if (!currentWebsite) {
            throw new Error("No website selected for whitelist update");
        }

        if (e.target.checked) {
            settings.whitelist = settings.whitelist.filter(
                (item) => item !== currentWebsite
            );
        } else {
            if (!Array.isArray(settings.whitelist)) {
                settings.whitelist = [];
            }
            settings.whitelist.push(currentWebsite);
        }

        sendUpdatedSettings("whitelist");
        showRefreshMessage("whitelist");
        displayWhiteList(true);
    } catch (error) {
        handleError("Failed to update whitelist", error);
        showErrorToUser("Failed to update whitelist. Please try again.");
        // Revert checkbox state
        e.target.checked = !e.target.checked;
    }
}

// Update specific blur with error handling
function updateSpecificBlur() {
    try {
        const checkedInput = document.querySelector(
            'input[name="specificBlur"]:checked'
        );

        // Store previous state before update
        const previousState = settings.specificBlur;

        // confirm with the user that they want to switch to specific blur
        if (checkedInput && !settings.specificBlur) {
            const translations = getTranslations(settings);
            if (!translations?.[settings.language]?.["#specificBlurConfirm"]) {
                throw new Error(
                    "Translation not found for confirmation message"
                );
            }

            if (
                !confirm(
                    translations[settings.language]["#specificBlurConfirm"]
                )
            ) {
                // reset the input to the previous value
                checkedInput.checked = false;
                return;
            }
        }

        settings.specificBlur = checkedInput
            ? checkedInput.value === "true"
            : false;

        sendUpdatedSettings("specificBlur").catch((error) => {
            // Revert to previous state if update fails
            settings.specificBlur = previousState;
            const inputs = document.querySelectorAll(
                'input[name="specificBlur"]'
            );
            inputs.forEach((input) => {
                input.checked = input.value === String(previousState);
            });
            throw error;
        });

        showRefreshMessage("specificBlur");
    } catch (error) {
        handleError("Failed to update specific blur setting", error);
        showErrorToUser("Failed to update blur setting. Please try again.");
    }
}

function showRefreshMessage(key) {
    if (refreshableSettings.includes(key) && refreshMessage) {
        refreshMessage.classList.remove("hidden");
    }
}

// Start the initialization
initPopup();
