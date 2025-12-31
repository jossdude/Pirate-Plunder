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

// Spin wheel with realistic physics
function spinWheel(wheel, items, resultElement, baseDuration = 3000, onComplete = null) {
    // Generate random target using secure randomness
    const targetIndex = getSecureRandom(items.length);
    const targetItem = items[targetIndex];
    
    // Calculate angle per segment
    const anglePerSegment = 360 / items.length;
    
    // Pointer is at top (0 degrees / -90 degrees from SVG coordinate system)
    // Each segment starts at index * anglePerSegment - 90 degrees
    // We want the center of the target segment to align with the pointer (top)
    const segmentCenterAngle = targetIndex * anglePerSegment + anglePerSegment / 2 - 90;
    const targetAngle = -segmentCenterAngle;
    
    // Add multiple full rotations for visual effect (using secure randomness)
    const extraRotations = 5 + getSecureRandom(3); // 5-7 full rotations
    const finalRotation = extraRotations * 360 + targetAngle;
    
    // Get current rotation (handle initial state)
    const currentTransform = wheel.style.transform || 'rotate(0deg)';
    let currentRotation = parseFloat(currentTransform.match(/-?\d+\.?\d*/)?.[0] || 0);
    
    // Normalize current rotation to 0-360 range
    currentRotation = ((currentRotation % 360) + 360) % 360;
    const targetRotation = currentRotation + finalRotation;
    
    // Physics parameters for realistic spinner
    const startVelocity = 15 + getSecureRandom(10); // Initial angular velocity (degrees per frame) - varies for realism
    const friction = 0.985; // Friction coefficient (slows down over time)
    const minVelocity = 0.15; // Minimum velocity before snapping to target
    
    let velocity = startVelocity;
    let rotation = currentRotation;
    let totalRotation = 0;
    let isDecelerating = false;
    
    wheel.classList.add('spinning');
    wheel.style.transition = 'none'; // Remove CSS transition for manual control
    
    // Animation loop with realistic physics
    function animate() {
        // Apply velocity
        rotation += velocity;
        totalRotation += Math.abs(velocity);
        
        // Apply friction (deceleration) - more aggressive as it slows
        if (velocity > 1) {
            velocity *= friction;
        } else {
            // More aggressive deceleration when slow
            velocity *= 0.95;
        }
        
        // Update wheel rotation
        wheel.style.transform = `rotate(${rotation}deg)`;
        
        // Calculate which segment is under the pointer
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        const pointerAngle = 90; // Pointer is at top (90 degrees in SVG coordinates)
        const adjustedAngle = (pointerAngle - normalizedRotation + 360) % 360;
        const currentIndex = Math.floor(adjustedAngle / anglePerSegment) % items.length;
        
        resultElement.textContent = items[currentIndex];
        
        // Check if we've spun enough and velocity is low
        const hasSpunEnough = totalRotation >= Math.abs(finalRotation) * 0.8;
        
        if (hasSpunEnough && velocity < minVelocity) {
            // Snap to final position with smooth transition
            wheel.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            wheel.style.transform = `rotate(${targetRotation}deg)`;
            
            // Set final result after a brief delay
            setTimeout(() => {
                resultElement.textContent = targetItem;
                resultElement.classList.add('rolling');
                
                // Remove spinning class
                setTimeout(() => {
                    wheel.classList.remove('spinning');
                    resultElement.classList.remove('rolling');
                    if (onComplete) onComplete();
                }, 500);
            }, 100);
            
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
    
    // Spin both wheels with callbacks
    spinWheel(letterWheel, letters, letterResult, 3000, onSpinComplete);
    spinWheel(numberWheel, numbers, numberResult, 3200, onSpinComplete);
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

