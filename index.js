// Util
const rgba = (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`; // rgba string
const randChannel = () => Math.floor(Math.random() * 256); // random int 0 to 255 (inc.)
const randAdjust = () => Math.round(Math.random() * 2) - 1; // random int -1, 0, or 1
const fade = (ctx, amount = 0.1) => {
    ctx.fillStyle = rgba(0, 0, 0, amount);
    ctx.fillRect(0, 0, width, height);
}; // apply translucent black rect over canvas
const scramble = string => {
    const letters = [ ...string ];
    return letters.sort(() => Math.random() < 0.5 ? 1 : -1).join('');
};
const setWord = string => {
    word = string;
    scrambledWord = scramble(word);
    textWidth = context.measureText(word).width;
    maxXPosition = width - textWidth;
    maxYPosition = height - textHeight;
}

// Global Setup
const {
    innerWidth: width,
    innerHeight: height,
} = window;
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const keyExp = /^[\w\s]$/; // valid characters to be used in the word

const SPEED_LIMIT = 10; // the maximum pixel distance the word can move in one frame
const FONT_SIZE = 100;

// Canvas Setup
Object.assign(canvas, { width, height });
context.font = `${FONT_SIZE}px Courier, monospace`;
context.textAlign = 'left';
context.textBaseline = 'top';

let editing = false;
let editingTimeout;
document.addEventListener('keyup', e => {
    const { key } = e;

    if (!key || !key.match(keyExp)) {
        return;
    }

    e.preventDefault();

    // editing not in progress, clear word and enter editing mode
    if (!editing) {
        editing = true;
        word = '';
    }

    setWord(word + key);

    // clear and restart editing timeout
    clearTimeout(editingTimeout);
    editingTimeout = setTimeout(() => {
        editing = false;
    }, 2000);
});

let target = null;
let targetingTimeout;
document.addEventListener('mousemove', ({ clientX, clientY }) => {
    target = {
        x: clientX,
        y: clientY,
    };

    clearTimeout(targetingTimeout);
    targetingTimeout = setTimeout(() => {
        target = null;
    }, 500);
});

// State Setup
let word;
let scrambledWord;
let shouldUseScrambled = false;
let position = [0, 0];
let vector = [0, 0];
let iterations = 0;
let maxXPosition;
let maxYPosition;

const textHeight = FONT_SIZE;

const draw = () => {
    // Fade
    if (iterations % 10 === 0) {
        fade(context);
    }

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

    // Calculate new position
    const newX = x + dx;
    const newY = y + dy;

    // Set new position within bounds
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
    context.fillStyle = rgba(randChannel(), randChannel(), randChannel());
    context.fillText(shouldUseScrambled ? scrambledWord : word, ...position);

    // Repeat
    iterations++;
    requestAnimationFrame(draw);
}

document.addEventListener('click', () => fade(context, 1));

// Start
setWord('SCRAMPAGE');
draw();
