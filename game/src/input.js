// Keyboard and mouse state. The game reads this each frame; nothing here
// knows about the world. Keys: WASD/arrows move, Shift sprints, E interacts,
// 1 or left-click throws a decoy coin, 2 or right-click drops smoke,
// P pauses, Enter starts, R retries.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, inside: false };
    this.clicked = null;
    this.rightClicked = false;
    this.pressed = new Set();

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.key.toLowerCase());
      this.keys.add(event.key.toLowerCase());
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
      this.mouse.inside = true;
    });
    canvas.addEventListener('mouseleave', () => {
      this.mouse.inside = false;
    });
    canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const point = {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height),
      };
      if (event.button === 0) this.clicked = point;
      if (event.button === 2) this.rightClicked = true;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  down(key) {
    return this.keys.has(key);
  }

  /** True once for the frame the key went down; consumed by endFrame. */
  wasPressed(key) {
    return this.pressed.has(key);
  }

  /** Normalised movement vector from WASD/arrows, or {x:0,y:0}. */
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down('a') || this.down('arrowleft')) x -= 1;
    if (this.down('d') || this.down('arrowright')) x += 1;
    if (this.down('w') || this.down('arrowup')) y -= 1;
    if (this.down('s') || this.down('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  get sprinting() {
    return this.down('shift');
  }

  /** Clear one-frame events; the main loop calls this after each update. */
  endFrame() {
    this.pressed.clear();
    this.clicked = null;
    this.rightClicked = false;
  }
}
