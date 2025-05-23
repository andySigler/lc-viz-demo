import { loadLiquid, loadWell, getTip} from "./sharedData.js"
import { SimContext } from "./simulate.js"
import { AspirateKeyFrameGenerator, SingleDispenseKeyFrameGenerator } from "./keyFrame.js"
import { Patterns } from "./canvas.js"
import { Vessel } from "./vessel.js";


export class ViewCfg {
  constructor({
    target,
    liquidName,
    tipName,
    pipetteName,
    srcName,
    dstName,
    srcStartVolume,
    dstStartVolume,
    colors
  } = {}) {
    this.target = target;
    this.liquidName = liquidName;
    this.tipName = tipName;
    this.pipetteName = pipetteName;
    this.srcName = srcName;
    this.dstName = dstName;
    this.srcStartVolume = srcStartVolume;
    this.dstStartVolume = dstStartVolume;
    this.colors = colors;
  }
}


export class View {
  constructor(cfg) {
    this.cfg = cfg;

    this.mmPerPixel = undefined;
    this.secondsPerPixel = undefined;
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
    this.aspirateDuration = undefined;
    this.singleDispenseDuration = undefined;

    // vessels (built using sharedData + keyFrames)
    this.srcVessel = undefined;
    this.tipVessel = undefined;
    this.dstVessel = undefined;

    this.patterns = new Patterns(this.cfg.colors.liquid, this.cfg.colors.flow, 4, 2);
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
    this.aspirateDuration = this.aspirateKeyFrames[this.aspirateKeyFrames.length - 1].time;
    this.singleDispenseDuration = this.singleDispenseKeyFrames[this.singleDispenseKeyFrames.length - 1].time;
  }

  createNewVessel(name, transPoints) {
    let isWell = false;
    let aspDuration = this.aspirateDuration;
    let dispDuration = this.singleDispenseDuration;
    if (name === this.cfg.srcName) {
      dispDuration = 0.0;  // only show aspirate (zero dispense)
      isWell = true;
    }
    else if (name === this.cfg.dstName) {
      aspDuration = 0.0;  // only show dispense (zero aspirate)
      isWell = true;
    }
    else if (name !== this.cfg.tipName) {
      throw new Error(`unexpected vessel name: ${name}`)
    }
    const vessel = new Vessel(
      name,
      transPoints,
      this.mmPerPixel,
      aspDuration,
      dispDuration,
      this.secondsPerPixel,
      isWell,
      this.cfg.colors,
    )


    if (!isWell) {
      vessel.createCanvasForAction("aspirate", this.parentId);
      vessel.drawAction("aspirate", this.aspirateKeyFrames, this.patterns);
      vessel.createCanvasPlastic(this.parentId);
      vessel.drawPlastic(this.aspirateKeyFrames[this.aspirateKeyFrames.length - 1]);
      vessel.createCanvasForAction("singleDispense", this.parentId);
      vessel.drawAction("singleDispense", this.singleDispenseKeyFrames, this.patterns);
    }
    else if (aspDuration) {
      vessel.createCanvasPlastic(this.parentId);
      vessel.drawPlastic(this.aspirateKeyFrames[0]);
      vessel.createCanvasForAction("aspirate", this.parentId);
      vessel.drawAction("aspirate", this.aspirateKeyFrames, this.patterns);
    }
    else if (dispDuration) {
      vessel.createCanvasForAction("singleDispense", this.parentId);
      vessel.drawAction("singleDispense", this.singleDispenseKeyFrames, this.patterns);
      vessel.createCanvasPlastic(this.parentId);
      vessel.drawPlastic(this.singleDispenseKeyFrames[this.singleDispenseKeyFrames.length - 1]);
    }
    return vessel;
  }

  async initialize(parentId, mmPerPixel, secondsPerPixel) {
    if (this.parentId) {
      throw new Error("View already initialized");
    }
    this.parentId = parentId;
    this.mmPerPixel = mmPerPixel;
    this.secondsPerPixel = secondsPerPixel;

    await this.loadFromSharedData();
    this.simulateAndGenerateKeyFrames();

    this.srcVessel = this.createNewVessel(this.cfg.srcName, this.loadedSrc.transitionPoints);
    this.tipVessel = this.createNewVessel(this.cfg.tipName, this.loadedTip.transitionPoints);
    this.dstVessel = this.createNewVessel(this.cfg.dstName, this.loadedDst.transitionPoints);
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