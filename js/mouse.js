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

  const isInside = (x, y) => {
    return x >= 0 && x <= canvas.width &&
           y >= 0 && y <= canvas.height;
  };

  const updateMouseState = (event, eventName, isDown) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const inside = isInside(x, y);

    // Update state in-place
    state.mouseX = x;
    state.mouseY = y;
    state.mouseInside = inside;
    if (isDown !== undefined) {
      state.mouseDown = isDown;
    }

    const shouldLog = inside || state.mouseInside;
    if (shouldLog) {
      printState(eventName);
    }
  };

  canvas.addEventListener('mousedown', (e) => {
    updateMouseState(e, 'mousedown', true);
  });

  canvas.addEventListener('mouseup', (e) => {
    updateMouseState(e, 'mouseup', false);
  });

  canvas.addEventListener('click', (e) => {
    updateMouseState(e, 'click', false);
  });

  canvas.addEventListener('mousemove', (e) => {
    updateMouseState(e, 'mousemove');
  });
}