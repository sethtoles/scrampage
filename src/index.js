import queryString from 'query-string';

// CONFIGURATION
const SPEED_LIMIT = 10; // The maximum pixel distance the word can move in one frame
const FONT_SIZE = 100;
const KEY_EXP = /^[\w\s]$/; // Valid characters to be used in the word
const EDITING_TIME = 2000; // How long after each character typed before leaving editing mode
const MOUSE_FOLLOW_TIME = 500; // How long the text will follow the mouse after it stops moving
const MOTION_FOLLOW_TIME = 3000; // How long the text will follow the device orientation
const TAIL_LIMITS = [ 2, 1000 ]; // The normal bounds of a tail length
const INTRO_LENGTH = 200; // How many iterations before the word starts moving
const KEYBOARD_DELAY = 2000; // How long a user must press to get a keyboard
// Random Event Timing - time to wait for event to start and duration of event in seconds
const EVENT_TIMING = {
    scramble: {
        wait: [5, 40],
        duration: [0, 8],
    },
    tail: {
        wait: [2.5, 20],
    },
    wander: {
        wait: [20, 40],
        duration: [2.5, 10],
    },
    colorMode: {
        wait: [30, 90],
        duration: [5, 10],
    },
};


// UTIL
const hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`; // hsl string
const randHue = () => Math.floor(Math.random() * 360); // Random int 0 to 360
const randPercent = () => Math.floor(Math.random() * 100); // Random int 0 to 100
const randAdjust = () => Math.round(Math.random() * 2) - 1; // Random int -1, 0, or 1
const scramble = string => [ ...string ].sort(() => Math.random() < 0.5 ? 1 : -1).join(''); // Rearrange letters in word
const randTail = () => Math.round(Math.random() * (TAIL_LIMITS[1] - TAIL_LIMITS[0])) + TAIL_LIMITS[0]; // Random tail length
const stripText = (text = '') => text.replace(/[^\w\s]/, ''); // Remove invalid characters from text
const randSecondsBetween = ([ lower, upper ]) => Math.round((Math.random() * (upper - lower) + lower) * 1000);


// STATE SETUP
let width;
let height;
let word;
let scrambledWord;
let shouldUseScrambled = false;
let position = [0, 0];
let vector = [0, 0];
let color = [ randHue(), 50, 50 ];
let colorVector = [ 0.1, 0 ];
let randomColorMode = false;
let randomColorIndex = 0;
let randomColorCaughtUp = false;
let textWidth;
let textHeight;
let iterations = 0;
let historyLength = randTail();
let targetHistoryLength = historyLength;
let shouldWander = true;
const changeHistory = [];


// ELEMENT SETUP
const canvas = document.getElementById('canvas');
const input = document.getElementById('input');
const consoleEl = document.getElementById('console'); // place to emit dubug statements
const context = canvas.getContext('2d');


// STATE MUTATION HELPERS

// Resize the canvas and set global width/height
const setBounds = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    context.font = `${FONT_SIZE}px Courier, monospace`;
    context.textAlign = 'left';
    context.textBaseline = 'top';
};

// Update global vars based on new word
const setWord = string => {
    word = string;
    scrambledWord = scramble(word);
    textWidth = context.measureText(word).width;
    textHeight = FONT_SIZE;
};

// Set the global position so that the word is centered
const centerWord = () => {
    position = [
        (width / 2) - (textWidth / 2),
        (height / 2) - (textHeight / 2),
    ];
};

// Scramble/restore word
const setScrambleWait = () => {
    const { wait } = EVENT_TIMING.scramble;
    setTimeout(() => {
        scrambledWord = scramble(word);
        shouldUseScrambled = true;

        setScrambleDuration();
    }, randSecondsBetween(wait));
};
const setScrambleDuration = () => {
    const { duration } = EVENT_TIMING.scramble;
    setTimeout(() => {
        shouldUseScrambled = false;

        setScrambleWait();
    }, duration ? randSecondsBetween(duration) : 0);
};

// Adjust tail length
const setTailWait = () => {
    const { wait } = EVENT_TIMING.tail;
    setTimeout(() => {
        targetHistoryLength = randTail();

        setTailDuration();
    }, randSecondsBetween(wait));
};
const setTailDuration = () => {
    const { duration } = EVENT_TIMING.tail;
    setTimeout(() => {
        targetHistoryLength = randTail();

        setTailWait();
    }, duration ? randSecondsBetween(duration) : 0);
};

// Toggle wandering
const setWanderWait = () => {
    const { wait } = EVENT_TIMING.wander;
    setTimeout(() => {
        shouldWander = false;

        setWanderDuration();
    }, randSecondsBetween(wait));
};
const setWanderDuration = () => {
    const { duration } = EVENT_TIMING.wander;
    setTimeout(() => {
        shouldWander = true;

        setWanderWait();
    }, duration ? randSecondsBetween(duration) : 0);
};

// Change color mode
const setColorWait = () => {
    const { wait } = EVENT_TIMING.colorMode;
    setTimeout(() => {
        randomColorMode = true;
        randomColorIndex = 0;
        randomColorCaughtUp = false;
    }, randSecondsBetween(wait));
};
const setColorDuration = () => {
    const { duration } = EVENT_TIMING.colorMode;
    setTimeout(() => {
        randomColorMode = false;

        setColorWait();
    }, duration ? randSecondsBetween(duration) : 0);
};


// TEXT EDITING - Desktop
let editing = false;
let editingTimeout;
const editText = e => {
    // handleInput change will be used instead
    if (shouldShowKeyboard) {
        return;
    }

    e.preventDefault();
    const { key } = e;

    if (!key || !key.match(KEY_EXP)) {
        return;
    }

    // Editing not in progress, clear word and enter editing mode
    if (!editing) {
        editing = true;
        word = '';
    }

    // Add new letter to word
    setWord(word + key);

    // Clear and restart editing timeout
    clearTimeout(editingTimeout);
    editingTimeout = setTimeout(() => {
        editing = false;
    }, EDITING_TIME);
};
// TEXT EDITING - Mobile
let keyboardTimeout;
let shouldShowKeyboard;
const waitForKeyboard = () => {
    clearTimeout(keyboardTimeout);
    keyboardTimeout = setTimeout(() => {
        shouldShowKeyboard = true;
    }, KEYBOARD_DELAY);
}
const cancelKeyboard = () => {
    if (shouldShowKeyboard) {
        input.focus();
    }
    clearTimeout(keyboardTimeout);
    shouldShowKeyboard = false;
}
const handleInputChange = () => {
    const strippedWord = stripText(input.value).trim();
    setWord(strippedWord);
}
const handleInputBlur = () => {
    input.value = '';
}


// MOUSE TARGETING
let target = null;
let targetingTimeout;
const setTarget = ({ clientX, clientY }) => {
    target = {
        x: clientX,
        y: clientY,
    };

    clearTimeout(targetingTimeout);
    targetingTimeout = setTimeout(() => {
        target = null;
    }, MOUSE_FOLLOW_TIME);
};


// MOTION TRACKING
const deviceAcceleration = { x: 0, y: 0 };
let motionTimeout;
const handleMotion = e => {
    const {
        accelerationIncludingGravity: acceleration = {},
        rotationRate = {},
    } = e;
    const { alpha, beta } = rotationRate;

    // Device has moved significantly, start tracking motion
    if (Math.abs(alpha) > 50 || Math.abs(beta) > 50) {
        clearTimeout(motionTimeout);
        motionTimeout = setTimeout(() => {
            motionTimeout = 0;
        }, MOTION_FOLLOW_TIME);
    }

    if (motionTimeout) {
        if (orientation === 90) {
            deviceAcceleration.x = Math.max(-1, Math.min(1, acceleration.y / -9.8));
            deviceAcceleration.y = Math.max(-1, Math.min(1, acceleration.x / -9.8));
        }
        else if (orientation === -90) {
            deviceAcceleration.x = Math.max(-1, Math.min(1, acceleration.y / 9.8));
            deviceAcceleration.y = Math.max(-1, Math.min(1, acceleration.x / 9.8));
        }
        else {
            deviceAcceleration.x = Math.max(-1, Math.min(1, acceleration.x / 9.8));
            deviceAcceleration.y = Math.max(-1, Math.min(1, acceleration.y / -9.8));
        }
    }
    else {
        deviceAcceleration.x = 0;
        deviceAcceleration.y = 0;
    }
}


// FRAME RENDERER
const draw = () => {
    // Clear existing content
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    if (iterations === INTRO_LENGTH) {
        setScrambleWait();
        setTailWait();
        setWanderWait();
        setColorWait();
    }

    if (iterations > INTRO_LENGTH) {
        // Get current position and direction
        const [ x, y ] = position;
        let [ dx, dy ] = vector;

        if (target) {
            // Get midpoint of text
            const midX = x + (textWidth / 2);
            const midY = y + (textHeight / 2);
            // Get distances from midpoint to target
            const diffX = target.x - midX;
            const diffY = target.y - midY;
            // Add percent of target vector to movement
            dx += diffX * 0.01;
            dy += diffY * 0.01;
        }

        // Set new position within bounds
        const newX = Math.round(x + dx);
        const newY = Math.round(y + dy);
        const maxXPosition = width - textWidth;
        const maxYPosition = height - textHeight;
        position = [
            Math.max(0, Math.min(newX, maxXPosition)),
            Math.max(0, Math.min(newY, maxYPosition)),
        ];

        // Determine adjustment amount: random or accelerating
        const adjustX = (shouldWander ? randAdjust() : (dx * 1.003) - dx) + deviceAcceleration.x * 3;
        const adjustY = (shouldWander ? randAdjust() : (dy * 1.003) - dy) + deviceAcceleration.y * 3;

        // Adjust direction within [-SPEED_LIMIT, SPEED_LIMIT]
        vector = [
            Math.max(-SPEED_LIMIT, Math.min(dx + adjustX, SPEED_LIMIT)),
            Math.max(-SPEED_LIMIT, Math.min(dy + adjustY, SPEED_LIMIT)),
        ];

        // Flip x or y direction if text has hit an edge
        if (position[0] + textWidth >= width || position[0] <= 0) {
            vector[0] *= -1;
        }
        if (position[1] + textHeight >= height || position[1] <= 0) {
            vector[1] *= -1;
        }
    }

    // Get current color values
    const [ hue, saturation, lightness ] = color;
    const [ dHue, dLightness ] = colorVector;

    // Update color
    color = [
        (hue + dHue) % 360,
        100,
        Math.max(25, Math.min(lightness + dLightness, 65)),
    ];

    // Update color vector
    colorVector[1] = Math.max(-5, Math.min(dLightness + randAdjust(), 5));
    if (color[2] <= 25 || color[2] >= 65) {
        colorVector[1] *= -1;
    }

    if (randomColorMode) {
        if (!randomColorCaughtUp) {
            // Go through tail, randomly setting hue
            for (let i = 0; i < 3; i++) {
                if (randomColorIndex < historyLength - 1) {
                    const state = changeHistory[randomColorIndex];
                    const oldLightness = state.color[2];
                    state.color = [
                        randHue(),
                        100,
                        oldLightness,
                    ];
                    randomColorIndex++;
                }
                else {
                    // Caught up with tail, start counting towards mode end
                    randomColorCaughtUp = true;
                    setColorDuration();
                }
            }
        }
        else {
            color = [
                randHue(),
                100,
                Math.round(Math.random() * 40) + 25,
            ];
        }
    }

    // Push render state to history
    changeHistory.push({
        color: [...color],
        position: [...position],
        word: shouldUseScrambled ? scrambledWord : word,
        historyLength,
    });

    // Adjust history length towards target
    if (historyLength < targetHistoryLength) {
        historyLength++;
    }
    else if (historyLength > targetHistoryLength) {
        historyLength--;
    }

    // History is longer than it should be, remove the first entry
    if (changeHistory.length > historyLength) {
        changeHistory.shift();

        // Do double shift in case history length has gotten smaller
        if (changeHistory.length > historyLength) {
            changeHistory.shift();
        }
    }

    // Render all states
    changeHistory.forEach((state, index) => {
        const [ h, s, l ] = state.color;
        context.fillStyle = hsl(h, s, l * index / state.historyLength);
        context.fillText(state.word, ...state.position);
    })

    // Repeat
    iterations++;
    requestAnimationFrame(draw);
};


// EVENT LISTENERS
window.addEventListener('resize', setBounds);
window.addEventListener('devicemotion', handleMotion);

document.addEventListener('keyup', editText);
document.addEventListener('touchstart', waitForKeyboard);
document.addEventListener('touchend', cancelKeyboard);
document.addEventListener('mousemove', setTarget);

input.addEventListener('input', handleInputChange);
input.addEventListener('blur', handleInputBlur)


// URL WORD CHECK
const { message } = queryString.parse(location.search);


// START
setBounds();
setWord(stripText(message) || 'SCRAMPAGE');
centerWord();
draw();
