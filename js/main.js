import { t50, p50S, well2ml, well360ul } from './sharedData.js';
import { View } from './view.js';


const main = async () => {
  const view = new View(10, "water", t50, p50S, well2ml, well360ul, 1000.0, 0.0);
  await view.initialize();
}


document.addEventListener('DOMContentLoaded', main);
