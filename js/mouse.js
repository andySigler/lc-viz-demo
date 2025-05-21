export function applyMouseControls(canvas, canvasName = 'unknown') {
  const state = {
    mouseInside: false,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false
  };

  const printState = (eventName) => {
    console.log(`${canvasName}: ${eventName}(x=${state.mouseX}, y=${state.mouseY}, inside=${state.mouseInside}, down=${state.mouseDown})`);
  };

  const isInside = (x, y) =>
    x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height;

  const updateMouseState = (event, eventName, isDown) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const inside = isInside(x, y);

    state.mouseX = x;
    state.mouseY = y;
    state.mouseInside = inside;
    if (isDown !== undefined) {
      state.mouseDown = isDown;
    }

    if (inside || state.mouseInside) {
      // printState(eventName);
    }
  };

  const eventHandlers = {
    mousedown: (e) => updateMouseState(e, 'mousedown', true),
    mouseup: (e) => updateMouseState(e, 'mouseup', false),
    click: (e) => updateMouseState(e, 'click', false),
    mousemove: (e) => updateMouseState(e, 'mousemove')
  };

  for (const [event, handler] of Object.entries(eventHandlers)) {
    canvas.addEventListener(event, handler);
  }

  const removeEventHandlers = () => {
    for (const [event, handler] of Object.entries(eventHandlers)) {
      canvas.removeEventListener(event, handler);
    }
  };

  return { state, removeEventHandlers };
}
