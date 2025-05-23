import { Canvas2d } from './canvas.js';
import { TransitionPoint } from './sharedData.js'


export class VesselColors {
  constructor(plastic, liquid, flow, outline, background) {
    this.plastic = plastic;
    this.liquid = liquid;
    this.flow = flow;
    this.outline = outline;
    this.background = background;
  }
}


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


export class Vessel {
  constructor(name, transitionPoints, millimetersPerPixel, aspirateDuration, singleDispenseDuration, secondsPerPixel, isWell, colors) {
    this.name = name;
    this.transitionPoints = transitionPoints;
    this.millimetersPerPixel = millimetersPerPixel;
    this.aspirateDuration = aspirateDuration;
    this.singleDispenseDuration = singleDispenseDuration;
    this.secondsPerPixel = secondsPerPixel;
    this.isWell = isWell;

    this.colors = colors;

    this.canvasPlastic = undefined;
    this.canvasesActions = {
      "aspirate": undefined,
      "singleDispense": undefined
    };
  }

  get heightMm() {
    return this.transitionPoints[this.transitionPoints.length - 1].distanceFromBottom;
  }

  get heightPx() {
    return this.heightMm / this.millimetersPerPixel;
  }

  get widthMmPlastic() {
    return this.transitionPoints[this.transitionPoints.length - 1].width;
  }

  get widthPxPlastic() {
    return this.widthMm / this.millimetersPerPixel;
  }

  getWidthPxAction(action) {
    if (action == "aspirate") {
      if (!this.aspirateDuration) {
        throw new Error(`[${this.name}] aspirate duration: ${this.aspirateDuration}`);
      }
      return this.aspirateDuration / this.secondsPerPixel;
    }
    else if (action === "singleDispense") {
      if (!this.singleDispenseDuration) {
        throw new Error(`[${this.name}] singleDispense duration: ${this.singleDispenseDuration}`);
      } 
      return this.singleDispenseDuration / this.secondsPerPixel;
    }
    throw new Error(`unexpected action: ${action}`);
  }

  createCanvasPlastic(parentId) {
    const w = this.widthPx;
    const h = this.heightPx;
    this.canvasPlastic = new Canvas2d(w, h, parentId);
  }

  createCanvasForAction(action, parentId) {
    const w = this.getWidthPxAction(action);
    const h = this.heightPx;
    this.canvasesActions[action] = new Canvas2d(w, h, parentId);
  }

  setCanvasPositionPlastic(offsetFromCenterX, offsetFromTopY) {
    this.canvasPlastic.setPosition(offsetFromCenterX, offsetFromTopY);
    this.canvasPlastic.updatePosition();
  }

  setCanvasPositionForAction(action, offsetFromCenterX, offsetFromTopY) {
    this.canvasesActions[action].setPosition(offsetFromCenterX, offsetFromTopY);
    this.canvasesActions[action].updatePosition();
  }

  updateCanvasPositions() {
    this.canvasPlastic.updatePosition();
    for (let action in this.canvasesActions) {
      if (this.canvasesActions[action]) {
        this.canvasesActions[action].updatePosition();
      }
    }
  }

  remove() {
    if (this.canvasPlastic) {
      this.canvasPlastic.remove();
    }
    this.canvasPlastic = undefined;
    for (let c of this.canvasesActions) {
      c.remove();
    }
    this.canvasesActions = [];
  }

  drawPlastic(keyFrame) {
    // vessel outline (in pixels)
    const outlineTransitionPoints = [];
    for (let tp of this.transitionPoints) {
      const tpAsPixels = tp.asPixels(this.millimetersPerPixel, 1.0);
      outlineTransitionPoints.push(tpAsPixels);
    }
    // liquid outline (in pixels)
    const kfAsPixels = keyFrame.asPixels(this.millimetersPerPixel, 1.0);
    const liqHeightPixels = kfAsPixels.liquidHeight(this.isWell)
    const airHeightPixels = kfAsPixels.airHeight(this.isWell)
    const liquidTransitionPoints = clipDistanceFromBottom(
      outlineTransitionPoints, airHeightPixels, liqHeightPixels
    );

    // draw
    this.canvasPlastic.background(this.colors.background);
    this.canvasPlastic.stroke(this.colors.outline);
    this.canvasPlastic.strokeWidth(1);
    this.canvasPlastic.fill(this.colors.plastic);
    this.canvasPlastic.drawTransitionPoints(outlineTransitionPoints);
    this.canvasPlastic.fill(this.colors.liquid);
    this.canvasPlastic.drawTransitionPoints(liquidTransitionPoints);
  }

  drawAction(action, keyFrames, patterns) {
    const canvas = this.canvasesActions[action];
    if (!canvas) {
      throw new Error(`unexpected action: ${action}`);
    }
    const keyFramesPixels = [];
    for (let frame of keyFrames) {
      const kfPix = frame.asPixels(this.millimetersPerPixel, this.secondsPerPixel);
      keyFramesPixels.push(kfPix);
    }
    canvas.background(this.colors.plastic);
    canvas.stroke(this.colors.outline);
    canvas.fill(this.colors.liquid);
    canvas.drawKeyFrames(keyFramesPixels, this.isWell, patterns);
  }
}
