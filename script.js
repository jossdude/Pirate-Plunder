// Debug: Verify script is loading
console.log('=== SCRIPT.JS LOADING ===');
console.log('Document ready state:', document.readyState);
console.log('Body exists:', !!document.body);

// Simple test - change page background color to verify script runs
document.body.style.backgroundColor = '#f0f0f0';
console.log('Background color changed - script is running!');

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

// Debug: Check if elements exist
console.log('Elements check:');
console.log('letterResult:', letterResult);
console.log('letterWheel:', letterWheel);
console.log('letterContentGroup:', letterContentGroup);
console.log('numberContentGroup:', numberContentGroup);

// Track wheel rotation states (using objects so they're passed by reference)
const letterWheelRotation = { value: 0 };
const numberWheelRotation = { value: 0 };

// Wheel data
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const numbers = Array.from({length: 18}, (_, i) => i + 1);

// Spinner dimensions
const SPINNER_CENTER_X = 300;
const SPINNER_CENTER_Y = 300;
const SPINNER_RADIUS = 250;

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
    
    // Create orange arc outline for visible semi-circle (curved top edge)
    // Arc goes from left edge to right edge, curving upward (180 degree arc for top half)
    const arcPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const leftX = SPINNER_CENTER_X - SPINNER_RADIUS;
    const rightX = SPINNER_CENTER_X + SPINNER_RADIUS;
    // Create arc from left to right, curving upward (large arc flag = 1 for 180 degrees)
    arcPath.setAttribute('d', `M ${leftX} ${SPINNER_CENTER_Y} A ${SPINNER_RADIUS} ${SPINNER_RADIUS} 0 1 1 ${rightX} ${SPINNER_CENTER_Y}`);
    arcPath.setAttribute('fill', 'none');
    arcPath.setAttribute('stroke', '#ff8c00');
    arcPath.setAttribute('stroke-width', '8');
    arcPath.setAttribute('stroke-linecap', 'round');
    container.appendChild(arcPath);
    
    // Create orange radiating lines from center
    const numLines = 12;
    for (let i = 0; i < numLines; i++) {
        const angle = (i * 360 / numLines) * (Math.PI / 180);
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
        line.setAttribute('stroke', '#ff8c00');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');
        container.appendChild(line);
    }
    
    // Create items (letters/numbers) positioned around the circle
    items.forEach((item, index) => {
        const angle = (index * anglePerItem - 90) * (Math.PI / 180); // Start at top (-90 degrees)
        const textX = SPINNER_CENTER_X + textRadius * Math.cos(angle);
        const textY = SPINNER_CENTER_Y + textRadius * Math.sin(angle);
        
        // Calculate rotation so text is readable (perpendicular to radius)
        const textRotation = (angle * 180 / Math.PI) + 90;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#000');
        text.setAttribute('font-size', items.length <= 12 ? '32' : '24');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('transform', `rotate(${textRotation} ${textX} ${textY})`);
        text.textContent = item;
        text.setAttribute('class', 'spinner-item');
        text.setAttribute('data-index', index);
        
        container.appendChild(text);
    });
}

// Initialize spinners
console.log('Initializing spinners...');
console.log('Letter content group:', letterContentGroup);
console.log('Number content group:', numberContentGroup);

if (!letterContentGroup || !numberContentGroup) {
    console.error('Content groups not found!');
    alert('ERROR: Content groups not found! Check console for details.');
} else {
    createSpinnerContent(letterContentGroup, letters);
    createSpinnerContent(numberContentGroup, numbers);
    console.log('Spinner content created');
    console.log('Letter content children:', letterContentGroup.children.length);
    console.log('Number content children:', numberContentGroup.children.length);
}

// Keep full viewBox - CSS will handle the clipping
// The SVG will show the full circle, and CSS overflow will clip to show only the visible half

// Set initial results
if (letterResult) letterResult.textContent = letters[0];
if (numberResult) numberResult.textContent = numbers[0];

// Spin wheel with realistic physics
function spinWheel(wheel, items, resultElement, baseDuration = 3000, onComplete = null, rotationState) {
    // Generate random target using secure randomness
    const targetIndex = getSecureRandom(items.length);
    const targetItem = items[targetIndex];
    
    // Calculate angle per item
    const anglePerItem = 360 / items.length;
    
    // Pointer is at top-center (0 degrees / -90 degrees from SVG coordinate system)
    // Each item starts at index * anglePerItem - 90 degrees
    // We want the center of the target item to align with the pointer (top-center)
    const itemCenterAngle = targetIndex * anglePerItem + anglePerItem / 2 - 90;
    const targetAngle = -itemCenterAngle;
    
    // Add multiple full rotations for visual effect (using secure randomness)
    const extraRotations = 5 + getSecureRandom(3); // 5-7 full rotations
    const finalRotation = extraRotations * 360 + targetAngle;
    
    // Use tracked rotation state
    const startRotation = rotationState.value;
    const targetRotation = startRotation + finalRotation;
    
    // Physics parameters for realistic spinner
    const startVelocity = 10 + getSecureRandom(8); // Initial angular velocity (degrees per frame)
    const friction = 0.98; // Friction coefficient (slows down over time)
    const minVelocity = 0.25; // Minimum velocity before snapping to target
    const minDuration = 2000; // Minimum spin duration in milliseconds
    
    let velocity = startVelocity;
    let rotation = startRotation;
    let totalRotation = 0;
    let frameCount = 0;
    const startTime = Date.now();
    
    wheel.classList.add('spinning');
    wheel.style.transition = 'none'; // Remove CSS transition for manual control
    wheel.style.transform = `rotate(${rotation}deg)`;
    
    // Animation loop with realistic physics
    function animate() {
        frameCount++;
        const elapsed = Date.now() - startTime;
        
        // Apply velocity
        rotation += velocity;
        totalRotation += Math.abs(velocity);
        
        // Apply friction (deceleration)
        velocity *= friction;
        
        // Update wheel rotation
        wheel.style.transform = `rotate(${rotation}deg)`;
        rotationState.value = rotation; // Update tracked rotation
        
        // Calculate which item is at the top-center position
        // Top-center is at 0 degrees (or -90 degrees in SVG coordinates)
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        // Adjust for SVG coordinate system (top is -90 degrees)
        const pointerAngle = -90; // Top-center position
        const adjustedAngle = (pointerAngle - normalizedRotation + 360) % 360;
        const currentIndex = Math.floor(adjustedAngle / anglePerItem) % items.length;
        
        resultElement.textContent = items[currentIndex];
        
        // Check if we should stop - need minimum duration AND spin enough AND be slow enough
        const minSpinDistance = Math.abs(finalRotation) * 0.6; // At least 60% of target rotation
        const hasMinDuration = elapsed >= minDuration;
        const hasSpunEnough = totalRotation >= minSpinDistance;
        const isSlowEnough = velocity < minVelocity;
        const shouldStop = hasMinDuration && hasSpunEnough && isSlowEnough;
        
        if (shouldStop || frameCount > 600) { // Safety limit
            // Snap to final position with smooth transition
            wheel.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            wheel.style.transform = `rotate(${targetRotation}deg)`;
            rotationState.value = targetRotation; // Update tracked rotation
            
            // Set final result after transition
            setTimeout(() => {
                resultElement.textContent = targetItem;
                resultElement.classList.add('rolling');
                
                // Remove spinning class
                setTimeout(() => {
                    wheel.classList.remove('spinning');
                    resultElement.classList.remove('rolling');
                    if (onComplete) onComplete();
                }, 500);
            }, 500);
            
            return;
        }
        
        // Continue animation
        requestAnimationFrame(animate);
    }
    
    // Start animation
    requestAnimationFrame(animate);
}

// Track active spins
let activeSpins = 0;

// Handle roll button click
function handleRoll() {
    // Disable button during roll
    rollButton.disabled = true;
    activeSpins = 2;
    
    // Callback to re-enable button when spins complete
    const onSpinComplete = () => {
        activeSpins--;
        if (activeSpins === 0) {
            rollButton.disabled = false;
        }
    };
    
    // Spin both wheels with callbacks and rotation state
    spinWheel(letterWheel, letters, letterResult, 3000, onSpinComplete, letterWheelRotation);
    spinWheel(numberWheel, numbers, numberResult, 3200, onSpinComplete, numberWheelRotation);
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

