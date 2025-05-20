import { Canvas2d } from './canvas.js';


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
    return this.transitionPoints[this.transitionPoints.length - 1].width;
  }

  get heightMm() {
    return this.transitionPoints[this.transitionPoints.length - 1].mmFromBottom;
  }

  get widthPx() {
    return this.widthMm / this.millimetersPerPixel;
  }

  get heightPx() {
    return this.heightMm / this.millimetersPerPixel;
  }

  createCanvasPlastic(parentId) {
    this.canvasPlastic = new Canvas2d(this.widthPx, this.heightPx, parentId);
  }

  drawFromKeyFrame(keyFrame) {
    this.canvasPlastic.background(200, 200, 200);
    // first draw the liquid as a rectangle over the background
    // then draw outline shape
    const tPointsPixels = [];
    for (let tp of this.transitionPoints) {
      tPointsPixels.push(tp.asPixels(this.millimetersPerPixel));
    }
    this.canvasPlastic.drawOutline(tPointsPixels);
  }
}


export class WellVessel extends Vessel {
  constructor(transitionPoints, millimetersPerPixel) {
    super(transitionPoints, millimetersPerPixel);
  }
}
