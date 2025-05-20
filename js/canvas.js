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

  stroke(r, g, b, a = 1.0) {
    this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    this.doStroke = true;
  }

  fill(r, g, b, a = 1.0) {
    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
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
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.fillAndStrokeIfEnabled();
    this.ctx.closePath();
  }

  background(r, g, b, a = 1.0) {
    this.noStroke();
    this.fill(r, g, b, a);
    this.rect(r, g, this.canvas.width, this.canvas.height)
  }
}
