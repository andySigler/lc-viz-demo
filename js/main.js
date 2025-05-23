import { defaultView } from './defaults.js';
import { View } from './view.js';
import { createDomUI } from './inputs.js';


const mmPerPixel = 0.3;
const secondsPerPixel = 0.01;

let view = undefined;


const changeView = async (cfg) => {
  if (view) {
    view.remove();
    view = undefined;
  }
  view = new View(cfg);
  await view.initialize("container", mmPerPixel, secondsPerPixel);
  view.draw();
}


const main = async () => {
  createDomUI("inputs", defaultView, changeView);
  await changeView(defaultView);
}

document.addEventListener('DOMContentLoaded', main);
