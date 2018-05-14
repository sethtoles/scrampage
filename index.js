// Util
const rgba = (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;
const randChannel = () => Math.floor(Math.random() * 256);
const randAdjust = () => Math.round(Math.random() * 2) - 1;
const fade = (ctx, amount = 0.1) => {
    ctx.fillStyle = rgba(0, 0, 0, amount);
    ctx.fillRect(0, 0, width, height);
};
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

const SPEED_LIMIT = 10;
const FONT_SIZE = 100;

// Canvas Setup
Object.assign(canvas, { width, height });
context.font = `${FONT_SIZE}px Courier, monospace`;
context.textAlign = 'left';
context.textBaseline = 'top';

// State Setup
let word = 'SCRAMPAGE';
let position = [0, 0];
let vector = [0, 0];
let iterations = 0;

const textHeight = FONT_SIZE;
const textWidth = context.measureText(word).width;

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
