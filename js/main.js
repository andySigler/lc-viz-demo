import { defaultView } from './defaults.js';
import { View } from './view.js';


const parentNodeId = "container";
const mmPerPixel = 0.15;


const main = async () => {
  const view = new View(defaultView);
  await view.initialize(parentNodeId, mmPerPixel);
}

document.addEventListener('DOMContentLoaded', main);
