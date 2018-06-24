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

    word += key;
    textWidth = context.measureText(word).width;

    // clear and restart editing timeout
    clearTimeout(editingTimeout);
    editingTimeout = setTimeout(() => {
        editing = false;
    }, 2000);
});

// State Setup
let word = 'SCRAMPAGE';
let position = [0, 0];
let vector = [0, 0];
let iterations = 0;

const textHeight = FONT_SIZE;
let textWidth = context.measureText(word).width;

const draw = () => {
    // Fade
    if (iterations % 10 === 0) {
        fade(context);
    }

    if (Math.random() < 0.00005) {
        word = scramble(word);
    }

    // Change
    const [ x, y ] = position;
    const [ dx, dy ] = vector;
    position = [
        Math.max(0, Math.min(x + dx, width - textWidth)),
        Math.max(0, Math.min(y + dy, height - textHeight)),
    ];
    vector = [
        Math.max(-SPEED_LIMIT, Math.min(dx + randAdjust(), SPEED_LIMIT)),
        Math.max(-SPEED_LIMIT, Math.min(dy + randAdjust(), SPEED_LIMIT)),
    ];

    if (position[0] + textWidth >= width || position[0] <= 0) {
        vector[0] *= -1;
    }

    if (position[1] + textHeight >= height || position[1] <= 0) {
        vector[1] *= -1;
    }

    // Render
    context.fillStyle = rgba(randChannel(), randChannel(), randChannel());
    context.fillText(word, ...position);

    // Repeat
    iterations++;
    requestAnimationFrame(draw);
}

document.addEventListener('click', () => fade(context, 1));

draw();
