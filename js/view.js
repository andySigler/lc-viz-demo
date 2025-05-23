import { loadLiquid, loadWell, getTip} from "./sharedData.js"
import { SimContext } from "./simulate.js"
import { AspirateKeyFrameGenerator, SingleDispenseKeyFrameGenerator } from "./keyFrame.js"
import { Patterns } from "./canvas.js"
import { Vessel } from "./vessel.js";


export class ViewConfig {
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
    this.liquidName = liquidName;
    this.tipName = tipName;
    this.target = target;  // Number
    this.pipetteName = pipetteName;
    this.srcName = srcName;
    this.dstName = dstName;
    this.srcStartVolume = srcStartVolume; // Number
    this.dstStartVolume = dstStartVolume; // Number
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
      // TIP
      vessel.createCanvasPlastic(this.parentId);
      vessel.createCanvasForAction("aspirate", this.parentId);
      vessel.createCanvasForAction("singleDispense", this.parentId);
    }
    else if (aspDuration) {
      vessel.createCanvasPlastic(this.parentId);
      vessel.createCanvasForAction("aspirate", this.parentId);
    }
    else if (dispDuration) {
      vessel.createCanvasPlastic(this.parentId);
      vessel.createCanvasForAction("singleDispense", this.parentId);
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

    const srcPlasticCanvasWidth = this.srcVessel.canvasPlastic.width;
    const tipPlasticCanvasWidth = this.tipVessel.canvasPlastic.width;
    const tipPlasticCanvasHeight = this.tipVessel.canvasPlastic.height;
    const tipAspirateCanvasWidth = this.tipVessel.canvasesActions["aspirate"].width;
    const dstDispenseCanvasWidth = this.dstVessel.canvasesActions["singleDispense"].width;

    // NOTE: coordinates are:
    //          (x) offset from center, negative is to the left
    //          (y) distance from top of screen, positive is downward
    const padding = 10.0;
    // TIP
    const tipPlasticXY = {
      "x": -tipPlasticCanvasWidth / 2.0,
      "y": padding
    };
    // ASPIRATE + DISPENSE inside the TIP
    const tipAspirateXY = {
      "x": -tipAspirateCanvasWidth + -padding + tipPlasticXY.x,
      "y": padding
    };
    const tipDispenseXY = {
      "x": padding + -tipPlasticXY.x,
      "y": padding
    };
    // ASPIRATE inside the WELL
    const srcAspirateXY = {
      "x": tipAspirateXY.x,
      "y": tipAspirateXY.y + padding + tipPlasticCanvasHeight
    };
    // DISPENSE inside the WELL
    const dstDispenseXY = {
      "x": tipDispenseXY.x,
      "y": tipDispenseXY.y + padding + tipPlasticCanvasHeight
    };
    // WELLS
    const srcPlasticXY = {
      "x": srcAspirateXY.x + -padding + -srcPlasticCanvasWidth,
      "y": srcAspirateXY.y
    };
    const dstPlasticXY = {
      "x": dstDispenseXY.x + dstDispenseCanvasWidth + padding,
      "y": dstDispenseXY.y
    };
    
    this.tipVessel.setCanvasPositionPlastic(tipPlasticXY.x, tipPlasticXY.y);
    this.tipVessel.setCanvasPositionForAction("aspirate", tipAspirateXY.x, tipAspirateXY.y);
    this.tipVessel.setCanvasPositionForAction("singleDispense", tipDispenseXY.x, tipDispenseXY.y);
    this.srcVessel.setCanvasPositionPlastic(srcPlasticXY.x, srcPlasticXY.y);
    this.srcVessel.setCanvasPositionForAction("aspirate", srcAspirateXY.x, srcAspirateXY.y);
    this.dstVessel.setCanvasPositionPlastic(dstPlasticXY.x, dstPlasticXY.y);
    this.dstVessel.setCanvasPositionForAction("singleDispense", dstDispenseXY.x, dstDispenseXY.y);

    this.updateVesselPositions();
  }

  updateVesselPositions() {
    this.srcVessel.updateCanvasPositions();
    this.tipVessel.updateCanvasPositions();
    this.dstVessel.updateCanvasPositions();
  }

  draw() {
    // SRC
    this.srcVessel.drawPlastic(this.aspirateKeyFrames[0]);
    this.srcVessel.drawAction("aspirate", this.aspirateKeyFrames, this.patterns);
    // TIP
    this.tipVessel.drawAction("aspirate", this.aspirateKeyFrames, this.patterns);
    this.tipVessel.drawPlastic(this.aspirateKeyFrames[this.aspirateKeyFrames.length - 1]);
    this.tipVessel.drawAction("singleDispense", this.singleDispenseKeyFrames, this.patterns);
    // DST
    this.dstVessel.drawAction("singleDispense", this.singleDispenseKeyFrames, this.patterns);
    this.dstVessel.drawPlastic(this.singleDispenseKeyFrames[this.singleDispenseKeyFrames.length - 1]);
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