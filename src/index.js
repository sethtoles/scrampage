import queryString from 'query-string';

// CONFIGURATION
const SPEED_LIMIT = 10; // The maximum pixel distance the word can move in one frame
const FONT_SIZE = 100;
const KEY_EXP = /^[\w\s]$/; // Valid characters to be used in the word
const EDITING_TIME = 2000; // How long after each character typed before leaving editing mode
const MOUSE_FOLLOW_TIME = 500; // How long the text will follow the mouse after it stops moving
const TAIL_LIMITS = [ 1, 1000 ]; // The normal bounds of a tail length
const INTRO_LENGTH = 200; // How many iterations before the word starts moving


// UTIL
const hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`; // hsl string
const randHue = () => Math.floor(Math.random() * 360); // Random int 0 to 360
const randPercent = () => Math.floor(Math.random() * 100); // Random int 0 to 100
const randAdjust = () => Math.round(Math.random() * 2) - 1; // Random int -1, 0, or 1
const scramble = string => [ ...string ].sort(() => Math.random() < 0.5 ? 1 : -1).join(''); // Rearrange letters in word
const randTail = () => Math.round(Math.random() * (TAIL_LIMITS[1] - TAIL_LIMITS[0])) + TAIL_LIMITS[0]; // Random tail length


// STATE SETUP
let width;
let height;
let word;
let scrambledWord;
let shouldUseScrambled = false;
let position = [0, 0];
let vector = [0, 0];
let color = [ randHue(), 50, 50 ];
let colorVector = [ 0, 0, 0 ];
let textWidth;
let textHeight;
let iterations = 0;
let historyLength = randTail();
let targetHistoryLength = historyLength;
let shouldWander = true;
const changeHistory = [];


// CANVAS SETUP
const canvas = document.getElementById('canvas');
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


// TEXT EDITING
let editing = false;
let editingTimeout;
const editText = e => {
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


// FRAME RENDERER
const draw = () => {
    // Clear existing content
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    if (iterations > INTRO_LENGTH) {
        // Scramble/restore word
        if (Math.random() < 0.003) {
            shouldUseScrambled = !shouldUseScrambled;
            if (!shouldUseScrambled) {
                scrambledWord = scramble(word);
            }
        }

        // Adjust tail length
        if (Math.random() < 0.003) {
            targetHistoryLength = randTail();
        }

        // Toggle wandering - more likely to wander than to stop
        if (Math.random() < 0.005) {
            shouldWander = true;
            if (Math.random() < 0.25) {
                shouldWander = false;
            }
        }

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
        const newX = x + dx;
        const newY = y + dy;
        const maxXPosition = width - textWidth;
        const maxYPosition = height - textHeight;
        position = [
            Math.max(0, Math.min(newX, maxXPosition)),
            Math.max(0, Math.min(newY, maxYPosition)),
        ];

        // Determine adjustment amount: random or accelerating
        const adjustX = shouldWander ? randAdjust() : (dx * 1.003) - dx;
        const adjustY = shouldWander ? randAdjust() : (dy * 1.003) - dy;

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
    const [ dHue, dSaturation, dLightness ] = colorVector;

    // Update color
    color = [
        (hue + dHue) % 360,
        100,
        Math.max(25, Math.min(lightness + dLightness, 65)),
    ];

    // Update color vector
    colorVector = [
        0.1,
        0,
        Math.max(-5, Math.min(dLightness + randAdjust(), 5)),
    ];

    if (color[2] <= 25 || color[2] >= 65) {
        colorVector[2] *= -1;
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
document.addEventListener('keyup', editText);
document.addEventListener('mousemove', setTarget);


// WORD CHECK
const { message } = queryString.parse(location.search);
const parsedMessage = (message || '').replace(/[^\w\s]/, '');


// START
setBounds();
setWord(parsedMessage || 'SCRAMPAGE');
centerWord();
draw();
