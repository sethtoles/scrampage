// CONFIGURATION
const SPEED_LIMIT = 10; // The maximum pixel distance the word can move in one frame
const FONT_SIZE = 100;
const KEY_EXP = /^[\w\s]$/; // Valid characters to be used in the word
const EDITING_TIME = 2000; // How long after each character typed before leaving editing mode
const MOUSE_FOLLOW_TIME = 500; // How long the text will follow the mouse after it stops moving


// UTIL
const hsla = (h, s, l, a = 1) => `hsla(${h}, ${s}%, ${l}%, ${a})`; // hsla string
const randHue = () => Math.floor(Math.random() * 360); // Random int 0 to 360
const randPercent = () => Math.floor(Math.random() * 100); // Random int 0 to 100
const randAdjust = () => Math.round(Math.random() * 2) - 1; // Random int -1, 0, or 1
const scramble = string => [ ...string ].sort(() => Math.random() < 0.5 ? 1 : -1).join(''); // Rearrange letters in word


// STATE SETUP
let width;
let height;
let word;
let scrambledWord;
let shouldUseScrambled = false;
let position = [0, 0];
let vector = [0, 0];
let color = hsla(randHue(), randPercent(), randPercent());
let textWidth;
let textHeight;


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
    // Fade existing content
    context.fillStyle = hsla(0, 0, 0, 0.03);
    context.fillRect(0, 0, width, height);

    // Scramble/restore word
    if (Math.random() < 0.005) {
        shouldUseScrambled = !shouldUseScrambled;
        if (!shouldUseScrambled) {
            scrambledWord = scramble(word);
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

    // Adjust direction randomly within [-SPEED_LIMIT, SPEED_LIMIT]
    vector = [
        Math.max(-SPEED_LIMIT, Math.min(dx + randAdjust(), SPEED_LIMIT)),
        Math.max(-SPEED_LIMIT, Math.min(dy + randAdjust(), SPEED_LIMIT)),
    ];

    // Flip x or y direction if text has hit an edge
    if (position[0] + textWidth >= width || position[0] <= 0) {
        vector[0] *= -1;
    }
    if (position[1] + textHeight >= height || position[1] <= 0) {
        vector[1] *= -1;
    }

    // Render
    context.fillStyle = color;
    context.fillText(shouldUseScrambled ? scrambledWord : word, ...position);

    // Repeat
    requestAnimationFrame(draw);
};


// EVENT LISTENERS
window.addEventListener('resize', setBounds);
document.addEventListener('keyup', editText);
document.addEventListener('mousemove', setTarget);


// START
setBounds();
setWord('SCRAMPAGE');
centerWord();
draw();
