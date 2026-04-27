
// Version number
const VERSION = '1.38';
console.log(`Plunder: A Pirates Life - Version ${VERSION}`);

// ============================================================
// Settings: persistence + state
// ============================================================
const STORAGE_KEYS = {
    playerMode: 'plunder.playerMode',
    noRepeats: 'plunder.noRepeats',
    soundEnabled: 'plunder.soundEnabled',
    usedCombos: 'plunder.usedCombos',
    lastResetDate: 'plunder.lastResetDate',
};

const DEFAULT_SETTINGS = {
    playerMode: 'many',
    noRepeats: 'off',
    soundEnabled: 'on',
};

function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
}

function loadSettings() {
    return {
        playerMode: safeGet(STORAGE_KEYS.playerMode) || DEFAULT_SETTINGS.playerMode,
        noRepeats: safeGet(STORAGE_KEYS.noRepeats) || DEFAULT_SETTINGS.noRepeats,
        soundEnabled: safeGet(STORAGE_KEYS.soundEnabled) || DEFAULT_SETTINGS.soundEnabled,
    };
}

function saveSetting(key, value) {
    safeSet(STORAGE_KEYS[key], value);
}

function loadUsedCombos() {
    try {
        const raw = safeGet(STORAGE_KEYS.usedCombos);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveUsedCombos(combos) {
    try { safeSet(STORAGE_KEYS.usedCombos, JSON.stringify(combos)); } catch (e) { /* ignore */ }
}

function todayLocalDateString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function checkDailyReset() {
    const today = todayLocalDateString();
    const last = safeGet(STORAGE_KEYS.lastResetDate);
    if (last !== today) {
        saveUsedCombos([]);
        safeSet(STORAGE_KEYS.lastResetDate, today);
        return true;
    }
    return false;
}

const settings = loadSettings();
checkDailyReset();
let usedCombos = loadUsedCombos();

// Set viewport height to account for mobile browser UI
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set initial viewport height
setViewportHeight();

// Update on resize and orientation change
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
});

// Get DOM elements - script is at end of body so DOM is ready
const letterResult = document.getElementById('letter-result');
const numberResult = document.getElementById('number-result');
const rollButton = document.getElementById('roll-button');
const letterWheel = document.getElementById('letter-wheel');
const numberWheel = document.getElementById('number-wheel');
const letterContentGroup = document.getElementById('letter-wheel-content');
const numberContentGroup = document.getElementById('number-wheel-content');


// Track wheel rotation states (using objects so they're passed by reference)
const letterWheelRotation = { value: 0 };
const numberWheelRotation = { value: 0 };

// Wheel data
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function getNumberRange() {
    const max = settings.playerMode === 'two' ? 12 : 18;
    return Array.from({length: max}, (_, i) => i + 1);
}

let numbers = getNumberRange();

// Spinner dimensions
const SPINNER_CENTER_X = 375;
const SPINNER_CENTER_Y = 375;
const SPINNER_RADIUS = 357.5;

// Generate cryptographically secure random number in range [0, max)
function getSecureRandom(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Use modulo to get value in range, but handle modulo bias
    const maxValid = Math.floor(4294967296 / max) * max;
    let value = array[0];
    while (value >= maxValid) {
        crypto.getRandomValues(array);
        value = array[0];
    }
    return value % max;
}

// Generate wobbly path for organic edge effect
function generateWobblyPath(centerX, centerY, radius, numPoints = 80, variation = 0.04, seedOffset = 0) {
    // Use a simple seed based on center position and seedOffset for consistency per spinner
    const seed = Math.floor(centerX + centerY + seedOffset * 1000);
    let seedValue = seed;
    
    // Simple seeded random function
    function seededRandom() {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
    }
    
    const points = [];
    const angleStep = (Math.PI * 2) / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep;
        // Add random variation to radius (±variation%)
        const radiusVariation = 1 + (seededRandom() - 0.5) * 2 * variation;
        const currentRadius = radius * radiusVariation;
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);
        points.push({ x, y });
    }
    
    // Create smooth path using quadratic curves
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
        const nextIndex = (i + 1) % points.length;
        const cpX = (points[i].x + points[nextIndex].x) / 2;
        const cpY = (points[i].y + points[nextIndex].y) / 2;
        pathData += ` Q ${points[nextIndex].x} ${points[nextIndex].y} ${cpX} ${cpY}`;
    }
    pathData += ' Z';
    
    return pathData;
}

// Create spinner content with letters/numbers and radiating lines
function createSpinnerContent(container, items) {
    const anglePerItem = 360 / items.length;
    const textRadius = SPINNER_RADIUS * 0.75;
    
    // Get SVG element (parent of container)
    const svgElement = container.ownerSVGElement || container.parentNode;
    
    // Create defs element for gradients and patterns if it doesn't exist
    let defs = svgElement.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgElement.insertBefore(defs, svgElement.firstChild);
    }
    
    // Create unique IDs for this spinner
    const spinnerId = container.id || (container === letterContentGroup ? 'letter' : 'number');
    const gradientId = `goldGradient-${spinnerId}`;
    const patternId = `goldPattern-${spinnerId}`;
    const blurFilterId = `textureBlur-${spinnerId}`;
    const shadowFilterId = `dropShadow-${spinnerId}`;
    
    // Determine texture size based on spinner type
    // Letter spinner: larger (200x200), Number spinner: smaller (120x120)
    const isLetterSpinner = container === letterContentGroup;
    const textureSize = isLetterSpinner ? 200 : 120;
    
    // Create radial gradient for aged gold effect
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('cx', '50%');
    gradient.setAttribute('cy', '50%');
    gradient.setAttribute('r', '70%');
    
    // Add gradient stops for aged gold look
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#ffd700'); // Light gold center
    stop1.setAttribute('stop-opacity', '1');
    gradient.appendChild(stop1);
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '50%');
    stop2.setAttribute('stop-color', '#cd853f'); // Medium gold
    stop2.setAttribute('stop-opacity', '1');
    gradient.appendChild(stop2);
    
    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '85%');
    stop3.setAttribute('stop-color', '#8b6914'); // Dark gold
    stop3.setAttribute('stop-opacity', '1');
    gradient.appendChild(stop3);
    
    const stop4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop4.setAttribute('offset', '100%');
    stop4.setAttribute('stop-color', '#654321'); // Darkest gold/bronze edge
    stop4.setAttribute('stop-opacity', '1');
    gradient.appendChild(stop4);
    
    defs.appendChild(gradient);
    
    // Create texture pattern for weathered/aged look with variable size
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', textureSize.toString());
    pattern.setAttribute('height', textureSize.toString());
    
    // Scale factors for texture elements based on pattern size
    const scaleFactor = textureSize / 200; // Base size is 200
    
    // Create aged texture with multiple layers
    // Layer 1: Fine grain noise (pitting/oxidation)
    for (let i = 0; i < 30; i++) {
        const noiseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const x = Math.random() * textureSize;
        const y = Math.random() * textureSize;
        const r = (Math.random() * 3 + 0.5) * scaleFactor;
        const opacity = Math.random() * 0.2 + 0.1;
        noiseCircle.setAttribute('cx', x);
        noiseCircle.setAttribute('cy', y);
        noiseCircle.setAttribute('r', r);
        noiseCircle.setAttribute('fill', '#654321');
        noiseCircle.setAttribute('opacity', opacity);
        pattern.appendChild(noiseCircle);
    }
    
    // Layer 2: Scratches and wear lines
    for (let i = 0; i < 8; i++) {
        const scratch = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const x1 = Math.random() * textureSize;
        const y1 = Math.random() * textureSize;
        const length = (Math.random() * 75 + 25) * scaleFactor;
        const angle = Math.random() * Math.PI * 2;
        const x2 = x1 + Math.cos(angle) * length;
        const y2 = y1 + Math.sin(angle) * length;
        scratch.setAttribute('x1', x1);
        scratch.setAttribute('y1', y1);
        scratch.setAttribute('x2', x2);
        scratch.setAttribute('y2', y2);
        scratch.setAttribute('stroke', '#3d2817');
        scratch.setAttribute('stroke-width', (Math.random() * 2.5 + 1.5) * scaleFactor);
        scratch.setAttribute('opacity', Math.random() * 0.3 + 0.2);
        scratch.setAttribute('stroke-linecap', 'round');
        pattern.appendChild(scratch);
    }
    
    // Layer 3: Patina spots (darker oxidation areas)
    for (let i = 0; i < 5; i++) {
        const patina = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        const cx = Math.random() * textureSize;
        const cy = Math.random() * textureSize;
        const rx = (Math.random() * 15 + 5) * scaleFactor;
        const ry = (Math.random() * 15 + 5) * scaleFactor;
        patina.setAttribute('cx', cx);
        patina.setAttribute('cy', cy);
        patina.setAttribute('rx', rx);
        patina.setAttribute('ry', ry);
        patina.setAttribute('fill', '#3d2817');
        patina.setAttribute('opacity', Math.random() * 0.25 + 0.15);
        pattern.appendChild(patina);
    }
    
    defs.appendChild(pattern);
    
    // Create blur filter for texture softening
    const blurFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    blurFilter.setAttribute('id', blurFilterId);
    blurFilter.setAttribute('x', '-50%');
    blurFilter.setAttribute('y', '-50%');
    blurFilter.setAttribute('width', '200%');
    blurFilter.setAttribute('height', '200%');
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('in', 'SourceGraphic');
    feGaussianBlur.setAttribute('stdDeviation', '1.5');
    blurFilter.appendChild(feGaussianBlur);
    defs.appendChild(blurFilter);
    
    // Create drop shadow filter
    const shadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    shadowFilter.setAttribute('id', shadowFilterId);
    shadowFilter.setAttribute('x', '-50%');
    shadowFilter.setAttribute('y', '-50%');
    shadowFilter.setAttribute('width', '200%');
    shadowFilter.setAttribute('height', '200%');
    const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
    feOffset.setAttribute('in', 'SourceAlpha');
    feOffset.setAttribute('dx', '5');
    feOffset.setAttribute('dy', '6');
    feOffset.setAttribute('result', 'offset');
    shadowFilter.appendChild(feOffset);
    const feGaussianBlurShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlurShadow.setAttribute('in', 'offset');
    feGaussianBlurShadow.setAttribute('stdDeviation', '10');
    feGaussianBlurShadow.setAttribute('result', 'blur');
    shadowFilter.appendChild(feGaussianBlurShadow);
    const feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
    feFlood.setAttribute('flood-color', 'rgba(0, 0, 0, 0.5)');
    feFlood.setAttribute('result', 'color');
    shadowFilter.appendChild(feFlood);
    const feComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    feComposite.setAttribute('in', 'color');
    feComposite.setAttribute('in2', 'blur');
    feComposite.setAttribute('operator', 'in');
    feComposite.setAttribute('result', 'shadow');
    shadowFilter.appendChild(feComposite);
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'shadow');
    feMerge.appendChild(feMergeNode1);
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(feMergeNode2);
    shadowFilter.appendChild(feMerge);
    defs.appendChild(shadowFilter);
    
    // Generate wobbly path for organic edge (use spinnerId to create unique pattern per spinner)
    const seedOffset = isLetterSpinner ? 1 : 2;
    const wobblyPath = generateWobblyPath(SPINNER_CENTER_X, SPINNER_CENTER_Y, SPINNER_RADIUS, 80, 0.04, seedOffset);
    
    // Create wobbly path with gold gradient fill and drop shadow
    const circlePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    circlePath.setAttribute('d', wobblyPath);
    circlePath.setAttribute('fill', `url(#${gradientId})`);
    circlePath.setAttribute('stroke', '#654321'); // Dark bronze border
    circlePath.setAttribute('stroke-width', '8');
    circlePath.setAttribute('filter', `url(#${shadowFilterId})`);
    container.appendChild(circlePath);
    
    // Add texture overlay path (matches the base path exactly) - primary texture layer with blur
    const texturePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    texturePath.setAttribute('d', wobblyPath);
    texturePath.setAttribute('fill', `url(#${patternId})`);
    texturePath.setAttribute('opacity', '0.45');
    texturePath.setAttribute('filter', `url(#${blurFilterId})`);
    container.appendChild(texturePath);
    
    // Add secondary texture layer for additional depth and aging with blur
    const texturePath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    texturePath2.setAttribute('d', wobblyPath);
    texturePath2.setAttribute('fill', `url(#${patternId})`);
    texturePath2.setAttribute('opacity', '0.2');
    texturePath2.setAttribute('filter', `url(#${blurFilterId})`);
    container.appendChild(texturePath2);
    
    // Create gold/bronze radiating lines from center (one line per segment)
    for (let i = 0; i < items.length; i++) {
        const angle = (i * anglePerItem - 90) * (Math.PI / 180); // Start at top (-90 degrees)
        const lineLength = SPINNER_RADIUS * 0.9;
        const x1 = SPINNER_CENTER_X;
        const y1 = SPINNER_CENTER_Y;
        const x2 = SPINNER_CENTER_X + lineLength * Math.cos(angle);
        const y2 = SPINNER_CENTER_Y + lineLength * Math.sin(angle);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#8b6914'); // Dark gold/bronze
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('opacity', '0.7');
        container.appendChild(line);
    }
    
    // Create items (letters/numbers) positioned in the center of each segment
    items.forEach((item, index) => {
        // Position at center of segment: index * anglePerItem + anglePerItem/2 - 90
        const angle = (index * anglePerItem + anglePerItem / 2 - 90) * (Math.PI / 180);
        const textX = SPINNER_CENTER_X + textRadius * Math.cos(angle);
        const textY = SPINNER_CENTER_Y + textRadius * Math.sin(angle);
        
        // Calculate rotation so text is readable (perpendicular to radius)
        const textRotation = (angle * 180 / Math.PI) + 90;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#1a1a1a'); // Dark text for contrast
        text.setAttribute('font-size', items.length <= 12 ? '32' : '24');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('stroke', '#000'); // Black stroke for readability
        text.setAttribute('stroke-width', '0.5');
        text.setAttribute('stroke-linejoin', 'round');
        text.setAttribute('paint-order', 'stroke fill');
        text.setAttribute('transform', `rotate(${textRotation} ${textX} ${textY})`);
        text.textContent = item;
        text.setAttribute('class', 'spinner-item');
        text.setAttribute('data-index', index);
        
        container.appendChild(text);
    });
}

// Initialize spinners
if (!letterContentGroup || !numberContentGroup) {
    console.error('Content groups not found!');
} else {
    createSpinnerContent(letterContentGroup, letters);
    createSpinnerContent(numberContentGroup, numbers);
}

function rebuildNumberWheel() {
    if (!numberContentGroup) return;
    // Remove only the defs entries scoped to the number spinner so we don't
    // accumulate duplicate gradients/patterns/filters on every rebuild.
    const svg = numberContentGroup.ownerSVGElement;
    if (svg) {
        const defs = svg.querySelector('defs');
        if (defs) {
            const scopeSuffix = numberContentGroup.id || 'number';
            const scopedIds = [
                `goldGradient-${scopeSuffix}`,
                `goldPattern-${scopeSuffix}`,
                `textureBlur-${scopeSuffix}`,
                `dropShadow-${scopeSuffix}`,
            ];
            scopedIds.forEach(id => {
                const node = defs.querySelector(`[id="${id}"]`);
                if (node) node.remove();
            });
        }
    }

    while (numberContentGroup.firstChild) {
        numberContentGroup.removeChild(numberContentGroup.firstChild);
    }

    numbers = getNumberRange();

    numberWheelRotation.value = 0;
    numberWheel.style.transition = 'none';
    numberWheel.style.transform = 'rotate(0deg)';
    numberWheel.classList.remove('spinning');
    numberWheel.classList.remove('locked');

    createSpinnerContent(numberContentGroup, numbers);

    if (numberResult) {
        numberResult.textContent = getItemAtPointer(numbers, 0, 180);
    }
}

// Keep full viewBox - CSS will handle the clipping to show half of each spinner

// Helper function to calculate which item is at a pointer position
function getItemAtPointer(items, rotation, pointerAngle) {
    const anglePerItem = 360 / items.length;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const adjustedAngle = (pointerAngle - normalizedRotation + 360) % 360;
    const currentIndex = Math.floor(adjustedAngle / anglePerItem) % items.length;
    return items[currentIndex];
}

// Set initial results based on pointer positions
// Left spinner: pointer at right side (0 degrees)
// Right spinner: pointer at left side (180 degrees)
if (letterResult) letterResult.textContent = getItemAtPointer(letters, 0, 0);
if (numberResult) numberResult.textContent = getItemAtPointer(numbers, 0, 180);

// Spin wheel continuously, then stop after delay
function spinWheel(wheel, items, resultElement, rotationState, pointerAngle, stopDelay, onStop) {
    // Generate random target using secure randomness
    const targetIndex = getSecureRandom(items.length);
    const targetItem = items[targetIndex];
    
    // Calculate angle per item
    const anglePerItem = 360 / items.length;
    
    // Pointer angle is passed as parameter
    // Left spinner: 0 degrees (right side)
    // Right spinner: 180 degrees (left side)
    // Each item is centered at index * anglePerItem + anglePerItem/2 - 90 degrees
    // We want the center of the target item to align with the pointer
    const itemCenterAngle = targetIndex * anglePerItem + anglePerItem / 2 - 90;
    const targetAngle = pointerAngle - itemCenterAngle;
    
    // Use tracked rotation state
    const startRotation = rotationState.value;
    
    // Calculate final rotation (add some full rotations for visual effect)
    const extraRotations = 2 + getSecureRandom(2); // 2-3 full rotations
    const finalRotation = startRotation + extraRotations * 360 + targetAngle;
    
    // Start continuous spinning
    wheel.classList.add('spinning');
    wheel.classList.remove('locked');
    wheel.style.transition = 'none';
    
    // Continuous rotation speed (degrees per frame)
    const rotationSpeed = 15; // Fast continuous spin
    let rotation = startRotation;
    let animationId = null;
    
    // Animation loop for continuous spinning
    function animate() {
        rotation += rotationSpeed;
        wheel.style.transform = `rotate(${rotation}deg)`;
        rotationState.value = rotation;
        
        // Update result display during spin
        resultElement.textContent = getItemAtPointer(items, rotation, pointerAngle);
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Stop after delay and snap to final position
    setTimeout(() => {
        // Cancel animation
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
        }
        
        // Set final result
        resultElement.textContent = targetItem;
        resultElement.classList.add('rolling');
        
        // Snap immediately to final position
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${finalRotation}deg)`;
        rotationState.value = finalRotation;
        wheel.classList.remove('spinning');
        wheel.classList.add('locked');
        
        // Remove rolling class after brief moment
        setTimeout(() => {
            resultElement.classList.remove('rolling');
        }, 300);
        
        // Call stop callback
        if (onStop) {
            onStop();
        }
    }, stopDelay);
}

// Track if spinners are currently spinning
let isSpinning = false;

// Handle roll button click
function handleRoll() {
    // Prevent multiple simultaneous spins
    if (isSpinning) {
        return;
    }
    
    console.log('=== SPIN STARTED ===');
    
    // Disable button during spin
    rollButton.disabled = true;
    if (settingsGear) settingsGear.disabled = true;
    isSpinning = true;
    
    // Generate random stop time between 1000-3000ms
    const stopDelay = 1000 + getSecureRandom(2000); // 1000-3000ms
    console.log(`Spinners will stop after ${stopDelay}ms`);
    
    // Re-enable button after a very short delay (50-100ms)
    setTimeout(() => {
        rollButton.disabled = false;
        console.log('Button re-enabled (spinners still spinning)');
    }, 75); // 75ms delay
    
    // Callback when spinners stop
    let stoppedCount = 0;
    const onSpinnerStop = () => {
        stoppedCount++;
        if (stoppedCount === 2) {
            isSpinning = false;
            if (settingsGear) settingsGear.disabled = false;
            console.log('Both spinners stopped');
        }
    };
    
    // Spin both wheels with the same stop delay
    // Left spinner: pointer at right side (0 degrees in SVG coordinates)
    // Right spinner: pointer at left side (180 degrees in SVG coordinates)
    spinWheel(letterWheel, letters, letterResult, letterWheelRotation, 0, stopDelay, onSpinnerStop);
    spinWheel(numberWheel, numbers, numberResult, numberWheelRotation, 180, stopDelay, onSpinnerStop);
}

// Add event listener to roll button
rollButton.addEventListener('click', handleRoll);

// Optional: Add keyboard support (Space or Enter to roll)
document.addEventListener('keydown', (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !rollButton.disabled) {
        event.preventDefault();
        handleRoll();
    }
});

// ============================================================
// Settings modal wiring
// ============================================================
const settingsGear = document.getElementById('settings-gear');
const settingsModal = document.getElementById('settings-modal');
const settingsBackdrop = document.getElementById('settings-backdrop');
const settingsCloseButton = document.getElementById('settings-close');
const newGameButton = document.getElementById('new-game-button');
const noRepeatsToggle = document.getElementById('toggle-no-repeats');
const soundToggle = document.getElementById('toggle-sound');
const segmentButtons = document.querySelectorAll('.segment');

function syncSettingsUi() {
    segmentButtons.forEach(btn => {
        const isActive = btn.dataset.value === settings.playerMode;
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
    noRepeatsToggle.setAttribute('aria-checked', settings.noRepeats === 'on' ? 'true' : 'false');
    soundToggle.setAttribute('aria-checked', settings.soundEnabled === 'on' ? 'true' : 'false');
}

function openSettings() {
    if (isSpinning) return;
    checkDailyReset();
    usedCombos = loadUsedCombos();
    syncSettingsUi();
    settingsModal.hidden = false;
}

function closeSettings() {
    settingsModal.hidden = true;
}

settingsGear.addEventListener('click', openSettings);
settingsBackdrop.addEventListener('click', closeSettings);
settingsCloseButton.addEventListener('click', closeSettings);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !settingsModal.hidden) {
        closeSettings();
    }
});

segmentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        if (settings.playerMode === value) return;
        settings.playerMode = value;
        saveSetting('playerMode', value);
        syncSettingsUi();
        rebuildNumberWheel();
    });
});

noRepeatsToggle.addEventListener('click', () => {
    settings.noRepeats = settings.noRepeats === 'on' ? 'off' : 'on';
    saveSetting('noRepeats', settings.noRepeats);
    syncSettingsUi();
});

soundToggle.addEventListener('click', () => {
    settings.soundEnabled = settings.soundEnabled === 'on' ? 'off' : 'on';
    saveSetting('soundEnabled', settings.soundEnabled);
    syncSettingsUi();
});

newGameButton.addEventListener('click', () => {
    usedCombos = [];
    saveUsedCombos(usedCombos);
});

syncSettingsUi();

