// A utility function to safely get an element and log an error if it's missing.
const getElement = (id, required = true) => {
    const element = document.getElementById(id);
    if (!element && required) {
        // Only log errors for elements essential for core functionality
        console.error(`Required element with ID "${id}" not found.`);
    }
    return element;
};

// ===============================================
// === Core DOMContentLoaded Logic (Main App) ===
// ===============================================
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    // Initialize all global components first.
    initClock();
    initSidebarToggle();
    initWallpaperToggle();
    // initScrollbarHider() removed - rely on CSS for scrollbar control

    // Initialize page-specific components (must be non-blocking)
    initTextBoxStorage();
    initPasswordProtection();
    initKeyboardInput();
    initChecklist();
    generateCalendar();
    initThemeSelector();

    // Initialize Calendar Navigation Listeners (must run after generateCalendar is defined)
    initCalendarNavigationListeners();
});


// -----------------------------------------------
// 1. Clock Component
// -----------------------------------------------
function updateClock() {
    const now = new Date();
    // Use modern Intl API for robust and locale-aware time/date formatting
    const formattedTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    const formattedDate = now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Use required=false as clock elements may not exist on every single page (e.g., lock screen)
    const clockElement = getElement('clock', false);
    const dateElement = getElement('date', false);

    if (clockElement) {
        clockElement.textContent = formattedTime;
    }
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
}

function initClock() {
    // Run once immediately, then set interval
    updateClock();
    setInterval(updateClock, 1000);
}


// -----------------------------------------------
// 2. Sidebar Toggle (Hamburger Menu)
// -----------------------------------------------
function initSidebarToggle() {
    const hamburger = getElement('hamburger-menu', false);
    const sidebar = getElement('sidebar', false);

    if (!hamburger || !sidebar) {
        return; // Exit gracefully if elements are not present
    }

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('expanded');
    });
}


// -----------------------------------------------
// 3. Wallpaper Toggle
// -----------------------------------------------
const WALLPAPER_STORAGE_KEY = 'wallpaperState'; // 'video' or 'image'

function initWallpaperToggle() {
    const toggleButton = getElement('toggle-wallpaper-btn', false);
    const videoContainer = document.querySelector('.video-container');
    const video = getElement('video-background', false);

    if (!toggleButton || !videoContainer) {
        return; // Exit gracefully if button or container is missing
    }

    // Load initial state
    const savedState = localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'video';

    function setWallpaperState(state) {
        if (state === 'video' && video) {
            videoContainer.style.backgroundImage = 'none';
            video.style.display = 'block';
            // Use try/catch for play() due to potential browser autoplay restrictions
            video.play().catch(e => console.warn("Video autoplay prevented:", e.message));
            toggleButton.textContent = 'Use Static Image';
        } else {
            // Static image fallback
            videoContainer.style.backgroundImage = "url('images/stars21.png')";
            if (video) video.style.display = 'none';
            toggleButton.textContent = 'Use Video Background';
        }
        localStorage.setItem(WALLPAPER_STORAGE_KEY, state);
    }

    // Set initial state on load
    setWallpaperState(savedState);

    toggleButton.addEventListener('click', () => {
        const currentState = localStorage.getItem(WALLPAPER_STORAGE_KEY) === 'video' ? 'image' : 'video';
        setWallpaperState(currentState);
    });
}


// -----------------------------------------------
// 4. Notepad / Textbox Storage
// -----------------------------------------------
const TEXTAREA_STORAGE_KEY = 'notepadContent';

function initTextBoxStorage() {
    const textarea = getElement('notepad', false);

    if (!textarea) {
        return; // Exit safely
    }

    // Load and set saved content
    const savedContent = localStorage.getItem(TEXTAREA_STORAGE_KEY);
    if (savedContent) {
        textarea.value = savedContent;
    }

    // Save content on input
    textarea.addEventListener('input', () => {
        localStorage.setItem(TEXTAREA_STORAGE_KEY, textarea.value);
    });
}


// -----------------------------------------------
// 5. Password Protection (index.html only)
// -----------------------------------------------
// Placeholder for password logic, keeping the function definition for safety
function checkPassword() {
    // This function must be defined globally to be called by the form's onsubmit in index.html
    const passwordInput = getElement('passwordInput', false);
    if (passwordInput && passwordInput.value === 'twentyone') { // Example Password
        window.location.href = 'main.html'; // Navigate to the main app page
    } else {
        alert("Incorrect Passcode. Try '1234'."); // Using custom alert message box is better here
    }
}
window.checkPassword = checkPassword; // Expose to global scope for HTML form

function initPasswordProtection() {
    const passwordInput = getElement('passwordInput', false);
    if (!passwordInput) {
        return; // Exit safely if not on the lock page
    }
    // No additional listeners needed here as the form handles submit and keyboard handles input
}

function initKeyboardInput() {
    const keyboard = getElement('keyboard', false);
    const passwordInput = getElement('passwordInput', false);

    if (!keyboard || !passwordInput) {
        return; // Exit safely if not on the lock page
    }

    keyboard.addEventListener('click', (event) => {
        // Find the nearest key element (handles clicks on child spans/icons)
        const key = event.target.closest('.key');
        if (!key) return;

        const keyValue = key.getAttribute('data-key');

        if (keyValue === 'backspace') {
            passwordInput.value = passwordInput.value.slice(0, -1);
        } else if (keyValue === 'submit') {
            checkPassword(); // Call the global checkPassword function
        } else {
            // Limit to max 4 digits for passcode
            if (passwordInput.value.length < 4) {
                 passwordInput.value += keyValue;
            }
        }
    });
}


// -----------------------------------------------
// 6. Checklist Component (CONFIRMED FUNCTIONALITY)
// -----------------------------------------------
const CHECKLIST_STORAGE_KEY = 'checklistItems';

// Helper to save data to localStorage
function saveChecklist(items) {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(items));
}

// Helper to load data from localStorage
function loadChecklist() {
    const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

function deleteItem(index, checklistElement) {
    let items = loadChecklist();
    // Remove one item at the given index
    items.splice(index, 1);
    saveChecklist(items);
    renderChecklist(checklistElement);
}

function toggleItem(index, checklistElement) {
    let items = loadChecklist();
    // Toggle the checked state
    items[index].checked = !items[index].checked;
    saveChecklist(items);
    renderChecklist(checklistElement);
}

function renderChecklist(checklistElement) {
    const items = loadChecklist();
    checklistElement.innerHTML = ''; // Clear existing items

    items.forEach((item, index) => {
        const li = document.createElement('li');

        li.classList.add('checklist-item');
        li.dataset.index = index;

        // FIX: Use 'completed' class to match CSS for styling and button visibility
        if (item.checked) {
            li.classList.add('completed');
        }

        // Create the text span
        const textSpan = document.createElement('span');
        textSpan.classList.add('item-text');
        textSpan.textContent = item.text;

        // --- Delete Button (Visible/Required) ---
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-btn');
        deleteButton.textContent = '✕';

        // Add click handler for deletion (using addEventListener)
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // CRITICAL: Prevents the LI click (toggle) from triggering
            deleteItem(index, checklistElement);
        });

        // Attach elements
        li.append(textSpan, deleteButton);
        checklistElement.appendChild(li);

        // Add the click listener for toggling the state on the main list item area (using addEventListener)
        li.addEventListener('click', () => {
            toggleItem(index, checklistElement);
        });
    });
}

function addItem(inputBox, checklistElement) {
    const text = inputBox.value.trim();
    if (text === '') return;

    let items = loadChecklist();
    // New items are unchecked by 
    items.push({ text: text, checked: false });
    inputBox.value = '';
    saveChecklist(items);
    renderChecklist(checklistElement);
}


function initChecklist() {
    const inputBox = getElement('inputBox', false);
    const checklist = getElement('checklist', false);

    if (!inputBox || !checklist) return;

    // 1. Initial render
    renderChecklist(checklist);

    // 2. Handle Enter keypress to add new item
    inputBox.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addItem(inputBox, checklist);
        }
    });
}


// -----------------------------------------------
// 7. Calendar Component
// -----------------------------------------------
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Helper to get the calendar's localStorage key for the current month/year view
const getCalendarStorageKey = (year, month) => `calendarNotes-${year}-${month}`;

function generateCalendar() {
    const monthYearDisplay = getElement('month-year', false);
    const calendarBody = getElement('calendar-body', false);

    if (!monthYearDisplay || !calendarBody) {
        return; // Exit safely if not on the calendar page
    }

    // Clear existing days
    calendarBody.querySelectorAll('.day').forEach(d => d.remove());

    monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Get the first day of the month (0=Sunday, 6=Saturday)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    // Get the number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Load notes for the current month
    const localStorageKey = getCalendarStorageKey(currentYear, currentMonth);
    const savedNotes = JSON.parse(localStorage.getItem(localStorageKey) || '{}');

    // Fill in leading blank days
    for (let i = 0; i < firstDayOfMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day', 'empty-day');
        calendarBody.appendChild(dayDiv);
    }

    // Fill in days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');

        const dayNumber = document.createElement('span');
        dayNumber.textContent = i;
        dayDiv.dataset.date = `${currentYear}-${currentMonth + 1}-${i}`;

        // Highlight today's date if applicable
        const today = new Date();
        if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
             dayNumber.classList.add('today-highlight');
        }

        const textarea = document.createElement('textarea');
        textarea.placeholder = `...`;
        // Load saved text for this day (i.e., day 'i')
        textarea.value = savedNotes[i] || '';

        // Add event listener to save text to localStorage
        textarea.addEventListener('input', () => {
            savedNotes[i] = textarea.value;
            localStorage.setItem(localStorageKey, JSON.stringify(savedNotes));
        });

        dayDiv.append(dayNumber, textarea);
        calendarBody.appendChild(dayDiv);
    }
}

// Helper to update month/year and regenerate calendar
function navigateMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar();
}

// ----------------------------------------------
// Calendar Navigation Event Listeners
// ----------------------------------------------
function initCalendarNavigationListeners() {
    const prevButton = getElement('prev-month', false);
    const nextButton = getElement('next-month', false);

    if (prevButton) {
        prevButton.addEventListener('click', () => navigateMonth(-1));
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => navigateMonth(1));
    }
}


// -----------------------------------------------
// 8. Theme Selector Component
// -----------------------------------------------
const DEFAULT_HEX = '#ffffff'; // Default white
const COLOR_STORAGE_KEY = 'accentColor';
const ROOT_COLOR_VAR = '--accent-color';
const ROOT_RGB_COLOR_VAR = '--accent-color-rgb';

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    // Return comma-separated RGB string (e.g., "255, 0, 0") or default if parsing fails
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '253, 224, 71';
}

function applyColor(hexColor, inputElement = null) {
    // 1. Set the root CSS variables
    document.documentElement.style.setProperty(ROOT_COLOR_VAR, hexColor);
    document.documentElement.style.setProperty(ROOT_RGB_COLOR_VAR, hexToRgb(hexColor));

    // 2. Save to browser storage
    localStorage.setItem(COLOR_STORAGE_KEY, hexColor);

    // 3. Update the input element's value if provided
    if (inputElement) {
        inputElement.value = hexColor; // Ensure the picker reflects the actual color
    }

    // 4. Update display text (Only applicable if the hexDisplay element exists)
    const hexDisplay = getElement('hexDisplay', false);
    if(hexDisplay) {
        hexDisplay.textContent = 'Current Hex: ' + hexColor.toUpperCase();
    }
}

function initThemeSelector() {
    const colorInput = getElement('accentColorPicker', false);

    // 1. Determine the color to use: saved, or default
    const savedColor = localStorage.getItem(COLOR_STORAGE_KEY);
    const initialColor = savedColor || DEFAULT_HEX;

    // 2. Apply the color immediately on load to the whole document
    applyColor(initialColor, colorInput);

    // 3. If the input exists, set up listeners
    if (colorInput) {
        colorInput.addEventListener('input', (event) => {
            applyColor(event.target.value, colorInput);
        });

        colorInput.addEventListener('change', (event) => {
            // Re-apply on 'change' to ensure the final color is saved/displayed after selection
            applyColor(event.target.value, colorInput);
        });
    }
}
