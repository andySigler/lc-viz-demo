import { applyMouseControls } from './mouse.js';


export class Canvas2d {
  constructor(width, height, parentId) {
    this.width = Math.floor(width);
    this.height = Math.floor(height);
    const { canvas, state, removeEventHandlers } = Canvas2d.createCanvas(this.width, this.height, parentId);
    this.canvas = canvas;
    this.state = state;
    this.removeEventListeners = removeEventHandlers;

    this.ctx = this.canvas.getContext('2d');
    this.doFill = true;
    this.doStroke = true;
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

  translate(x, y) {
    this.ctx.translate(x, y);
  }

  strokeWidth(width) {
    this.ctx.lineWidth = width;
  }

  stroke(r, g, b) {
    this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    this.doStroke = true;
  }

  fill(r, g, b) {
    this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
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

  drawKeyFrames(keyFrames, isWell) {

    const drawLinesAtHeights = (heights) => {
      this.ctx.save();
      this.translate(0.0, this.canvas.height);  // bottom-left corner (starting position)
      this.ctx.beginPath();
      for (let i in heights) {
        this.ctx.lineTo(keyFrames[i].time, -heights[i]);
        this.ctx.lineTo(keyFrames[i].time, 0);
        this.ctx.lineTo(keyFrames[i].time, -heights[i]);
      }
      this.fillAndStrokeIfEnabled();
      this.ctx.restore();
    }

    const liquidHeights = [];
    const airHeights = [];
    for (let kf of keyFrames) {
      liquidHeights.push(kf.liquidHeight(isWell))
      airHeights.push(kf.airHeight(isWell))
    }

    drawLinesAtHeights(liquidHeights);
    drawLinesAtHeights(airHeights);
  }
}
