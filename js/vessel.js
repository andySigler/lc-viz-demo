/*
A vessel represents either the Tip or Well.

Holds multiple canvases:
 - 1x canvas for static image
 - 1x canvas for EACH time-graph
   * Aspirate, Dispense, Dispense, etc.

Information not yet available:
 - canvas size
   * height = mm/pixel
   * width = seconds ()

*/


export function createCanvasContext(width, height, parentId) {
  const cWidth = Math.floor(width);
  const cHeight = Math.floor(height);

  const canvas = document.createElement('canvas');
  canvas.width = cWidth;
  canvas.height = cHeight;

  const parent = document.getElementById(parentId);
  if (!parent) {
    console.warn(`Parent element with id "${parentId}" not found.`);
    return null;
  }

  parent.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, cWidth, cHeight);

  return {
    canvas,
    ctx,
    width: cWidth,
    height: cHeight
  };
}


class Vessel {
  constructor(transitionPoints, millimetersPerPixel) {
    this.transitionPoints = transitionPoints;
    this.millimetersPerPixel = millimetersPerPixel;
    this.canvasPlastic = undefined;
    this.canvasActions = [];
  }

  remove() {
    if (this.canvasPlasic) {
      this.canvasPlasic.remove();
    }
    for (let c in this.canvasActions) {
      c.remove()
    }
    this.canvasPlasic = undefined;
    this.canvasActions = [];
  }

  get widthMm() {
    return this.transitionPoints[this.transitionPoints.length - 1][1];
  }

  get heightMm() {
    return this.transitionPoints[this.transitionPoints.length - 1][0];
  }

  get widthPx() {
    return this.widthMm / this.millimetersPerPixel;
  }

  get heightPx() {
    return this.heightMm / this.millimetersPerPixel;
  }

  createCanvasPlastic(parentId) {
    this.canvasPlastic = createCanvasContext(this.widthPx, this.heightPx, parentId);
  }
}


export class WellVessel extends Vessel {
  constructor(transitionPoints, millimetersPerPixel) {
    super(transitionPoints, millimetersPerPixel);
  }
}
