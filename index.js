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

// Canvas Setup
Object.assign(canvas, { width, height });
context.font = '100px Courier, monospace';
context.textAlign = 'top left';

// State Setup
let position = [width / 2, height / 2];
let vector = [1, 1];
let word = 'SCRAMPAGE';

const draw = () => {
    // Maybe Fade
    if (Math.random() < 0.1) {
        fade(context);
    }

    if (Math.random() < 0.001) {
        word = scramble(word);
    }

    // Render
    context.fillStyle = rgba(randChannel(), randChannel(), randChannel());
    context.fillText(word, ...position);

    // Change
    const [ x, y ] = position;
    const [ dx, dy ] = vector;
    position = [ x + dx, y + dy ];
    vector = [ dx + randAdjust(), dy + randAdjust() ];

    if (position[0] > width || position[0] < 0) {
        vector[0] *= -1;
    }

    if (position[1] > height || position[1] < 0) {
        vector[1] *= -1;
    }

    // Repeat
    requestAnimationFrame(draw);
}

document.addEventListener('click', () => fade(context, 1));

draw();
