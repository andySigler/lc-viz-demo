import { applyMouseControls } from './mouse.js';


export class Patterns {
  constructor(colorFlow, colorLiquid, gap, lineWidth) {
    this.colorFlow = colorFlow;
    this.colorLiquid = colorLiquid;
    this.diagDown = this.createStripePattern('diagonal-down', gap * 0.66, 1);
    this.horizontal = this.createStripePattern('horizontal', gap, lineWidth * 0.7);
    this.diagUp = this.createStripePattern('diagonal-up', gap * 0.66, 1);
  }

  createStripePattern(orientation, gap, stripeWidth) {
    let width = 8, height = 8;

    if (orientation === 'horizontal') {
      width = 1;
      height = stripeWidth + gap;
    }

    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = width;
    patternCanvas.height = height;
    const ctx = patternCanvas.getContext('2d');

    // Fill background
    ctx.fillStyle = this.colorLiquid;
    ctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);

    ctx.strokeStyle = this.colorFlow;
    ctx.lineWidth = stripeWidth;

    if (orientation === 'horizontal') {
      ctx.fillStyle = this.colorFlow;
      ctx.fillRect(0, 0, 1, stripeWidth);
    } else if (orientation === 'diagonal-down') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, height);
      ctx.stroke();
    } else if (orientation === 'diagonal-up') {
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width, 0);
      ctx.stroke();
    } else {
      throw new Error(`Unsupported stripe orientation: ${orientation}`);
    }

    return ctx.createPattern(patternCanvas, 'repeat');
  }
}


export class Canvas2d {
  constructor(width, height, parentId, offsetFromCenterX = 0, offsetFromTopY = 0) {
    this.width = Math.floor(width);
    this.height = Math.floor(height);
    const { canvas, state, removeEventHandlers } =
      Canvas2d.createCanvas(this.width, this.height, parentId);
    this.canvas = canvas;
    this.state = state;
    this.removeEventListeners = removeEventHandlers;

    this.ctx = this.canvas.getContext('2d');
    this.doFill = true;
    this.doStroke = true;

    this.offsetFromCenterX = undefined;
    this.offsetFromTopY = undefined;
    this.setPosition(0, 0);
    this.updatePosition();
  }

  static createCanvas(width, height, parentId) {
    const parent = document.getElementById(parentId);
    if (!parent) {
      throw new Error(`Parent element with id "${parentId}" not found.`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const { state, removeEventHandlers } = applyMouseControls(canvas);
    parent.appendChild(canvas);

    return { canvas, state, removeEventHandlers };
  }

  setPosition(offsetFromCenterX, offsetFromTopY) {
    this.offsetFromCenterX = offsetFromCenterX;
    this.offsetFromTopY = offsetFromTopY;
  }

  updatePosition() {
    const parentRect = this.canvas.parentNode.getBoundingClientRect();
    const x = (parentRect.width / 2) + this.offsetFromCenterX - (this.width / 2);
    const y = this.offsetFromTopY;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${x}px`;
    this.canvas.style.top = `${y}px`;
  }

  remove() {
    this.removeEventListeners();
    this.canvas.remove();
    this.ctx = null;
    this.canvas = null;
  }

  save() {
    this.ctx.save();
  }

  restore() {
    this.ctx.restore();
  }

  translate(x, y) {
    this.ctx.translate(x, y);
  }

  strokeWidth(width) {
    this.ctx.lineWidth = width;
  }

  stroke(r, g, b) {
    if (g === undefined || b == undefined) {
      this.ctx.strokeStyle = r;
    }
    else {
      this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    }
    this.doStroke = true;
  }

  fill(r, g, b) {
    if (g === undefined || b == undefined) {
      this.ctx.fillStyle = r;
    }
    else {
      this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }
    this.doFill = true;
  }

  noStroke() {
    this.doStroke = false;
  }

  noFill() {
    this.doFill = false;
  }

  fillAndStrokeIfEnabled() {
    if (this.doFill) {
      this.ctx.fill();
    }
    if (this.doStroke) {
      this.ctx.stroke();
    }
  }

  rect(x, y, w, h) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.fillAndStrokeIfEnabled();
    this.ctx.closePath();
    this.ctx.restore();
  }

  circle(x, y, radius) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, radius, radius, 0, Math.PI * 2, false);
    this.fillAndStrokeIfEnabled();
    this.ctx.closePath();
    this.ctx.restore();
  }

  background(r, g, b) {
    this.ctx.save();
    this.noStroke();
    this.fill(r, g, b);
    this.rect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  drawTransitionPoints(transitionPoints) {
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height);
    this.ctx.beginPath();
    this.ctx.moveTo(-transitionPoints[0].width / 2, -transitionPoints[0].distanceFromBottom);
    for (let i = 1; i < transitionPoints.length; i++) {
      this.ctx.lineTo(-transitionPoints[i].width / 2, -transitionPoints[i].distanceFromBottom);
    }
    for (let i = transitionPoints.length - 1; i >= 0; i--) {
      this.ctx.lineTo(transitionPoints[i].width / 2, -transitionPoints[i].distanceFromBottom);
    }
    this.ctx.lineTo(-transitionPoints[0].width / 2, -transitionPoints[0].distanceFromBottom);
    this.fillAndStrokeIfEnabled();
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawKeyFrames(keyFrames, isWell, patterns) {
    const liquidHeights = [];
    const airHeights = [];
    for (let kf of keyFrames) {
      liquidHeights.push(kf.liquidHeight(isWell))
      airHeights.push(kf.airHeight(isWell))
    }

    const liquidSections = [];
    for (let i = 0; i < keyFrames.length - 1; i++) {
      liquidSections.push({
        "bottomLeft": [keyFrames[i].time, airHeights[i]],
        "topLeft": [keyFrames[i].time, liquidHeights[i]],
        "topRight": [keyFrames[i + 1].time, liquidHeights[i + 1]],
        "bottomRight": [keyFrames[i + 1].time, airHeights[i + 1]],
      })
    }

    let prevWasDiag = false;
    for (let s of liquidSections) {
      this.ctx.save();
      this.ctx.translate(0, this.canvas.height);
      this.ctx.beginPath();
      this.ctx.moveTo(s.bottomLeft[0], -s.bottomLeft[1]);
      this.ctx.lineTo(s.topLeft[0], -s.topLeft[1]);
      this.ctx.lineTo(s.topRight[0], -s.topRight[1]);
      this.ctx.lineTo(s.bottomRight[0], -s.bottomRight[1]);
      this.ctx.closePath();
      
      const sWidth = s.topRight[0] - s.topLeft[0];
      const diagPatternWidth = 8;
      if (s.topLeft[1] < s.topRight[1]) {
        this.ctx.fillStyle = patterns.diagUp;
        prevWasDiag = true;
        this.ctx.translate(sWidth - diagPatternWidth, 0);
      }
      else if (s.topLeft[1] > s.topRight[1]) {
        this.ctx.fillStyle = patterns.diagDown;
        prevWasDiag = true;
        this.ctx.translate(sWidth - diagPatternWidth, 0);
      }
      else if (prevWasDiag && s.bottomRight[0] != keyFrames[keyFrames.length - 1].time) {
        this.ctx.fillStyle = patterns.horizontal;
        prevWasDiag = false;
      }
      else {
        this.ctx.fillStyle = patterns.defaultColor;
        prevWasDiag = false;
      }

      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }
  }
}
