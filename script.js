
// Version number
const VERSION = '1.36';
console.log(`Plunder: A Pirates Life - Version ${VERSION}`);

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
const numbers = Array.from({length: 18}, (_, i) => i + 1);

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
    
    // Create texture pattern for weathered/aged look
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '200');
    pattern.setAttribute('height', '200');
    
    // Create aged texture with multiple layers
    // Layer 1: Fine grain noise (pitting/oxidation)
    for (let i = 0; i < 30; i++) {
        const noiseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const x = Math.random() * 200;
        const y = Math.random() * 200;
        const r = Math.random() * 3 + 0.5;
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
        const x1 = Math.random() * 200;
        const y1 = Math.random() * 200;
        const length = Math.random() * 75 + 25;
        const angle = Math.random() * Math.PI * 2;
        const x2 = x1 + Math.cos(angle) * length;
        const y2 = y1 + Math.sin(angle) * length;
        scratch.setAttribute('x1', x1);
        scratch.setAttribute('y1', y1);
        scratch.setAttribute('x2', x2);
        scratch.setAttribute('y2', y2);
        scratch.setAttribute('stroke', '#3d2817');
        scratch.setAttribute('stroke-width', Math.random() * 2.5 + 1.5);
        scratch.setAttribute('opacity', Math.random() * 0.3 + 0.2);
        scratch.setAttribute('stroke-linecap', 'round');
        pattern.appendChild(scratch);
    }
    
    // Layer 3: Patina spots (darker oxidation areas)
    for (let i = 0; i < 5; i++) {
        const patina = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        const cx = Math.random() * 200;
        const cy = Math.random() * 200;
        const rx = Math.random() * 15 + 5;
        const ry = Math.random() * 15 + 5;
        patina.setAttribute('cx', cx);
        patina.setAttribute('cy', cy);
        patina.setAttribute('rx', rx);
        patina.setAttribute('ry', ry);
        patina.setAttribute('fill', '#3d2817');
        patina.setAttribute('opacity', Math.random() * 0.25 + 0.15);
        pattern.appendChild(patina);
    }
    
    defs.appendChild(pattern);
    
    // Create full circle with gold gradient fill
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', SPINNER_CENTER_X);
    circle.setAttribute('cy', SPINNER_CENTER_Y);
    circle.setAttribute('r', SPINNER_RADIUS);
    circle.setAttribute('fill', `url(#${gradientId})`);
    circle.setAttribute('stroke', '#654321'); // Dark bronze border
    circle.setAttribute('stroke-width', '8');
    container.appendChild(circle);
    
    // Add texture overlay circle (matches the base circle exactly) - primary texture layer
    const textureCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    textureCircle.setAttribute('cx', SPINNER_CENTER_X);
    textureCircle.setAttribute('cy', SPINNER_CENTER_Y);
    textureCircle.setAttribute('r', SPINNER_RADIUS);
    textureCircle.setAttribute('fill', `url(#${patternId})`);
    textureCircle.setAttribute('opacity', '0.45');
    container.appendChild(textureCircle);
    
    // Add secondary texture layer for additional depth and aging (slightly offset)
    const textureCircle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    textureCircle2.setAttribute('cx', SPINNER_CENTER_X);
    textureCircle2.setAttribute('cy', SPINNER_CENTER_Y);
    textureCircle2.setAttribute('r', SPINNER_RADIUS);
    textureCircle2.setAttribute('fill', `url(#${patternId})`);
    textureCircle2.setAttribute('opacity', '0.2');
    container.appendChild(textureCircle2);
    
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

