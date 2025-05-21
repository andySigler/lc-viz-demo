import { Canvas2d } from './canvas.js';
import { TransitionPoint } from './sharedData.js'


function clipDistanceFromBottom(transitionPoints, min, max) {
  const result = [];

  const clipSegment = (a, b, t) => {
    const ratio = (t - a.distanceFromBottom) / (b.distanceFromBottom - a.distanceFromBottom);
    const width = a.width + ratio * (b.width - a.width);
    return new TransitionPoint(t, width);
  };

  for (let i = 0; i < transitionPoints.length - 1; i++) {
    const p1 = transitionPoints[i];
    const p2 = transitionPoints[i + 1];

    const y1 = p1.distanceFromBottom;
    const y2 = p2.distanceFromBottom;

    // Skip segment if completely outside clip range
    if (y1 < min && y2 < min) continue;
    if (y1 > max && y2 > max) continue;

    // Add p1 if it's the start of the first included segment
    if (y1 >= min && y1 <= max && result.length === 0) {
      result.push(new TransitionPoint(p1.distanceFromBottom, p1.width));
    }

    // Check and clip lower boundary
    if (y1 < min && y2 >= min) {
      result.push(clipSegment(p1, p2, min));
    }

    // Keep p2 if within range
    if (y2 >= min && y2 <= max) {
      result.push(new TransitionPoint(p2.distanceFromBottom, p2.width));
    }

    // Check and clip upper boundary
    if (y1 <= max && y2 > max) {
      result.push(clipSegment(p1, p2, max));
    }
  }

  return result;
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
    return this.transitionPoints[this.transitionPoints.length - 1].width;
  }

  get heightMm() {
    return this.transitionPoints[this.transitionPoints.length - 1].distanceFromBottom;
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

  drawFromKeyFrame(keyFrame, isWell = true) {
    // vessel outline (in pixels)
    const outlineTransitionPoints = [];
    for (let tp of this.transitionPoints) {
      const tpAsPixels = tp.asPixels(this.millimetersPerPixel);
      outlineTransitionPoints.push(tpAsPixels);
    }
    // liquid outline (in pixels)
    const kfAsPixels = keyFrame.asPixels(this.millimetersPerPixel);
    const liqHeightPixels = isWell
      ? kfAsPixels.liquidInWellHeight
      : kfAsPixels.liquidInTipHeight;
    const airHeightPixels = isWell
      ? 0.0
      : kfAsPixels.airInTipHeight;
    const liquidTransitionPoints = clipDistanceFromBottom(
      outlineTransitionPoints, airHeightPixels, liqHeightPixels
    );
    console.log(liquidTransitionPoints)
    // draw
    this.canvasPlastic.background(0, 0, 0);
    this.canvasPlastic.stroke(0, 0, 0);
    this.canvasPlastic.strokeWidth(1);
    this.canvasPlastic.fill(255, 255, 255);
    this.canvasPlastic.drawTransitionPoints(outlineTransitionPoints);
    this.canvasPlastic.noStroke();
    this.canvasPlastic.fill(100, 100, 255);
    this.canvasPlastic.drawTransitionPoints(liquidTransitionPoints);
  }
}


export class WellVessel extends Vessel {
  constructor(transitionPoints, millimetersPerPixel) {
    super(transitionPoints, millimetersPerPixel);
  }

  draw(keyFrame) {
    this.drawFromKeyFrame(keyFrame, true);
  }
}
