import { loadLiquid, loadWell, getTip} from "./sharedData.js"
import { SimContext } from "./simulate.js"
import { AspirateKeyFrameGenerator, SingleDispenseKeyFrameGenerator } from "./keyFrame.js"
import { WellVessel, TipVessel } from "./vessel.js";


export class ViewCfg {
  constructor({
    target,
    liquidName,
    tipName,
    pipetteName,
    srcName,
    dstName,
    srcStartVolume,
    dstStartVolume
  } = {}) {
    this.target = target;
    this.liquidName = liquidName;
    this.tipName = tipName;
    this.pipetteName = pipetteName;
    this.srcName = srcName;
    this.dstName = dstName;
    this.srcStartVolume = srcStartVolume;
    this.dstStartVolume = dstStartVolume;
  }
}


export class View {
  constructor(cfg) {
    this.cfg = cfg;

    this.mmPerPixel = undefined;
    this.parentId = undefined;

    this.loadedLiquid = undefined;
    this.loadedSrc = undefined;
    this.loadedDst = undefined;
    this.loadedTip = undefined;

    // simulation (built using sharedData)
    this.simulationCtx = undefined;

    // keyframes (built using sharedData + simulation)
    this.aspirateKeyFrames = undefined;
    this.singleDispenseKeyFrames = undefined;

    // vessels (built using sharedData + keyFrames)
    this.srcVessel = undefined;
    this.tipVessel = undefined;
    this.dstVessel = undefined;
  }

  async loadFromSharedData() {
    this.loadedLiquid = await loadLiquid(this.cfg.liquidName, this.cfg.pipetteName, this.cfg.tipName);
    this.loadedSrc = await loadWell(this.cfg.srcName);
    this.loadedDst = await loadWell(this.cfg.dstName);
    this.loadedTip = getTip(this.cfg.tipName);
  }

  simulateAndGenerateKeyFrames() {
    this.simulationCtx = new SimContext(
      this.cfg.target,
      this.loadedLiquid,
      this.loadedTip,
      this.cfg.pipetteName,
      this.loadedSrc,
      this.loadedDst,
      this.cfg.srcStartVolume,
      this.cfg.dstStartVolume
    );
    this.aspirateKeyFrames = (new AspirateKeyFrameGenerator(this.simulationCtx)).generate();
    this.singleDispenseKeyFrames = (new SingleDispenseKeyFrameGenerator(this.simulationCtx)).generate();
  }

  async initialize(parentId, mmPerPixel) {
    if (this.parentId) {
      throw new Error("View already initialized");
    }
    this.parentId = parentId;
    this.mmPerPixel = mmPerPixel;

    await this.loadFromSharedData();
    this.simulateAndGenerateKeyFrames();

    this.srcVessel = new WellVessel(this.loadedSrc.transitionPoints, this.mmPerPixel);
    this.tipVessel = new TipVessel(this.loadedTip.transitionPoints, this.mmPerPixel);
    this.dstVessel = new WellVessel(this.loadedDst.transitionPoints, this.mmPerPixel);
    this.srcVessel.createCanvasPlastic(this.parentId);
    this.tipVessel.createCanvasPlastic(this.parentId);
    this.dstVessel.createCanvasPlastic(this.parentId);

    // initialize drawing, starting from post-aspirate
    this.srcVessel.drawPlastic(this.aspirateKeyFrames[this.aspirateKeyFrames.length - 1]);
    this.tipVessel.drawPlastic(this.aspirateKeyFrames[this.aspirateKeyFrames.length - 1]);
    this.dstVessel.drawPlastic(this.aspirateKeyFrames[this.aspirateKeyFrames.length - 1]);

    // TODO: draw action canvases (2x for tip, 1x for each well)
  }

  remove() {
    if (this.srcVessel) {
      this.srcVessel.remove();
    }
    if (this.tipVessel) {
      this.tipVessel.remove();
    }
    if (this.dstVessel) {
      this.dstVessel.remove();
    }
    this.parentId = undefined;
  }
}