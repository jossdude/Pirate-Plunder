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

// Get DOM elements
const letterResult = document.getElementById('letter-result');
const numberResult = document.getElementById('number-result');
const rollButton = document.getElementById('roll-button');
const letterWheel = document.getElementById('letter-wheel');
const numberWheel = document.getElementById('number-wheel');
const letterSegmentsGroup = document.getElementById('letter-wheel-segments');
const numberSegmentsGroup = document.getElementById('number-wheel-segments');

// Wheel data
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const numbers = Array.from({length: 18}, (_, i) => i + 1);

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

// Create wheel segments
function createWheelSegments(container, items, colors) {
    const centerX = 150;
    const centerY = 150;
    const radius = 140;
    const anglePerSegment = 360 / items.length;
    
    items.forEach((item, index) => {
        const startAngle = (index * anglePerSegment - 90) * (Math.PI / 180);
        const endAngle = ((index + 1) * anglePerSegment - 90) * (Math.PI / 180);
        
        // Create path for segment
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArcFlag = anglePerSegment > 180 ? 1 : 0;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`);
        path.setAttribute('fill', colors[index % colors.length]);
        path.setAttribute('stroke', 'var(--pirate-dark-blue)');
        path.setAttribute('stroke-width', '1');
        
        // Add text label with proper rotation
        const midAngle = (startAngle + endAngle) / 2;
        const textRadius = radius * 0.7;
        const textX = centerX + textRadius * Math.cos(midAngle);
        const textY = centerY + textRadius * Math.sin(midAngle);
        const textRotation = (midAngle * 180 / Math.PI) + 90;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'var(--pirate-cream)');
        text.setAttribute('font-size', items.length <= 12 ? '18' : '14');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('transform', `rotate(${textRotation} ${textX} ${textY})`);
        text.textContent = item;
        
        container.appendChild(path);
        container.appendChild(text);
    });
}

// Initialize wheels
const letterColors = [
    'rgba(212, 175, 55, 0.3)',
    'rgba(139, 69, 19, 0.3)',
    'rgba(212, 175, 55, 0.4)',
    'rgba(139, 69, 19, 0.4)'
];

const numberColors = [
    'rgba(212, 175, 55, 0.3)',
    'rgba(139, 69, 19, 0.3)',
    'rgba(212, 175, 55, 0.4)',
    'rgba(139, 69, 19, 0.4)',
    'rgba(212, 175, 55, 0.35)',
    'rgba(139, 69, 19, 0.35)'
];

createWheelSegments(letterSegmentsGroup, letters, letterColors);
createWheelSegments(numberSegmentsGroup, numbers, numberColors);

// Spin wheel with physics
function spinWheel(wheel, items, resultElement, spinDuration = 3000) {
    // Generate random target using secure randomness
    const targetIndex = getSecureRandom(items.length);
    const targetItem = items[targetIndex];
    
    // Calculate angle per segment
    const anglePerSegment = 360 / items.length;
    
    // Pointer is at top (0 degrees / -90 degrees from SVG coordinate system)
    // Each segment starts at index * anglePerSegment - 90 degrees
    // We want the center of the target segment to align with the pointer (top)
    // Segment center = (index * anglePerSegment + anglePerSegment/2 - 90) degrees
    // To align center with top (0 degrees), we need to rotate by:
    const segmentCenterAngle = targetIndex * anglePerSegment + anglePerSegment / 2 - 90;
    const targetAngle = -segmentCenterAngle;
    
    // Add multiple full rotations for visual effect (using secure randomness)
    const extraRotations = 5 + getSecureRandom(3); // 5-7 full rotations
    const finalRotation = extraRotations * 360 + targetAngle;
    
    // Get current rotation (handle initial state)
    const currentTransform = wheel.style.transform || 'rotate(0deg)';
    const currentRotation = parseFloat(currentTransform.match(/-?\d+\.?\d*/)?.[0] || 0);
    
    // Apply spinning animation with easing
    wheel.classList.add('spinning');
    wheel.style.transition = `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    wheel.style.transform = `rotate(${currentRotation + finalRotation}deg)`;
    
    // Update result display during spin
    let spinProgress = 0;
    const updateInterval = setInterval(() => {
        spinProgress += 50;
        const progress = Math.min(spinProgress / spinDuration, 1);
        // Easing function for smoother animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentRotationValue = currentRotation + (finalRotation * easedProgress);
        
        // Calculate which segment is under the pointer
        const normalizedRotation = ((currentRotationValue % 360) + 360) % 360;
        const pointerAngle = 90; // Pointer is at top (90 degrees in SVG coordinates)
        const adjustedAngle = (pointerAngle - normalizedRotation + 360) % 360;
        const currentIndex = Math.floor(adjustedAngle / anglePerSegment) % items.length;
        
        resultElement.textContent = items[currentIndex];
    }, 50);
    
    // Set final result
    setTimeout(() => {
        clearInterval(updateInterval);
        resultElement.textContent = targetItem;
        resultElement.classList.add('rolling');
        wheel.classList.remove('spinning');
        
        setTimeout(() => {
            resultElement.classList.remove('rolling');
        }, 500);
    }, spinDuration);
}

// Handle roll button click
function handleRoll() {
    // Disable button during roll
    rollButton.disabled = true;
    
    // Spin both wheels
    spinWheel(letterWheel, letters, letterResult, 3000);
    spinWheel(numberWheel, numbers, numberResult, 3200);
    
    // Re-enable button after spin completes
    setTimeout(() => {
        rollButton.disabled = false;
    }, 3200);
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

