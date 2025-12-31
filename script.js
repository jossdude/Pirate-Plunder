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

// Generate random letter from A to L using secure randomness
function getRandomLetter() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const randomIndex = getSecureRandom(letters.length);
    return letters[randomIndex];
}

// Generate random number from 1 to 18 using secure randomness
function getRandomNumber() {
    return getSecureRandom(18) + 1;
}

// Add rolling animation class
function addRollingAnimation() {
    letterResult.classList.add('rolling');
    numberResult.classList.add('rolling');
    
    setTimeout(() => {
        letterResult.classList.remove('rolling');
        numberResult.classList.remove('rolling');
    }, 500);
}

// Handle roll button click
function handleRoll() {
    // Disable button during roll
    rollButton.disabled = true;
    
    // Add rolling animation
    addRollingAnimation();
    
    // Generate random values after a short delay for visual effect
    setTimeout(() => {
        const randomLetter = getRandomLetter();
        const randomNumber = getRandomNumber();
        
        // Update displays
        letterResult.textContent = randomLetter;
        numberResult.textContent = randomNumber;
        
        // Re-enable button
        rollButton.disabled = false;
    }, 250);
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

