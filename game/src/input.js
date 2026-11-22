// The Velvet Vault — keyboard and mouse, nothing else. WASD or arrows to
// move, Shift to sneak, E to crack the vault or grab loot, 1 for a smoke
// bomb, 2 for the EMP, R to restart, Enter or click to start. One clear job:
// read the player's hands.
export function makeInput() {
  const keys = new Set();
  const pressed = new Set(); // keys hit since the last frame was consumed
  const input = {
    keys,
    pressed,
    mouseX: 0,
    mouseY: 0,
    mouseClicked: false,
    attach(element) {
      window.addEventListener('keydown', (event) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
          event.preventDefault();
        }
        if (!event.repeat) pressed.add(event.key.toLowerCase());
        keys.add(event.key.toLowerCase());
      });
      window.addEventListener('keyup', (event) => {
        keys.delete(event.key.toLowerCase());
      });
      window.addEventListener('blur', () => keys.clear());
      element.addEventListener('mousemove', (event) => {
        const rect = element.getBoundingClientRect();
        input.mouseX = (event.clientX - rect.left) * (element.width / rect.width);
        input.mouseY = (event.clientY - rect.top) * (element.height / rect.height);
      });
      element.addEventListener('mousedown', () => {
        input.mouseClicked = true;
      });
    },
    // A unit movement vector from the held keys, or null when idle.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    get sneaking() {
      return keys.has('shift');
    },
    // True once per physical press; the game loop drains it each frame.
    wasPressed(key) {
      return pressed.has(key.toLowerCase());
    },
    endFrame() {
      pressed.clear();
      input.mouseClicked = false;
    },
  };
  return input;
}
