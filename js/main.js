import { loadLiquid, loadWell, getTip, t50, p50S, well2ml, well360ul } from './sharedData.js';
import { SimContext } from './simulate.js';
import { AspirateKeyFrameGenerator } from './keyFrame.js';
import { WellVessel } from './vessel.js';


async function showMeHowYouTransfer(target, liquidName, tipName, pipetteName, srcName, dstName, srcVolume, dstVolume, cb) {
  const loadedLiquid = await loadLiquid(liquidName, pipetteName, tipName);
  const loadedSrc = await loadWell(srcName);
  const loadedDst = await loadWell(dstName);
  const loadedTip = getTip(tipName);
  
  // simulation (built using sharedData)
  const ctx = new SimContext(target, loadedLiquid, loadedTip, pipetteName, loadedSrc, loadedDst, srcVolume, dstVolume);
  
  // keyframes (built using sharedData + simulation)
  const aspirateKeyFrames = (new AspirateKeyFrameGenerator(ctx)).generate();

  // vessels (built using sharedData + keyFrames)
  const aspirateWellVessel = new WellVessel(loadedSrc.transitionPoints, 0.25);
  aspirateWellVessel.createCanvasPlastic("container-zzz");
  aspirateWellVessel.canvasPlastic.background(0, 0, 0);
}

document.addEventListener('DOMContentLoaded', () => {
  showMeHowYouTransfer(10, "water", t50, p50S, well2ml, well360ul, 1000.0, 0.0)
});
