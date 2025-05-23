import { defaultView } from './defaults.js';
import { View } from './view.js';


const parentNodeId = "container";
const mmPerPixel = 0.3;
const secondsPerPixel = 0.01;


const main = async () => {
  const view = new View(defaultView);
  await view.initialize(parentNodeId, mmPerPixel, secondsPerPixel);
  view.draw();
}

document.addEventListener('DOMContentLoaded', main);
