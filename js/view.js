import { loadLiquid, loadWell, getTip} from "./sharedData.js"

export class View {
  constructor(target, liquidName, tipName, pipetteName, srcName, dstName, srcVolume, dstVolume) {
    this.target = target;
    this.liquidName = liquidName;
    this.tipName = tipName;
    this.pipetteName = pipetteName;
    this.scrName = srcName;
    this.dstName = dstName;
    this.srcVolume = srcVolume;
    this.dstVolume = dstVolume;

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
    this.loadedLiquid = await loadLiquid(this.liquidName, this.pipetteName, this.tipName);
    this.loadedSrc = await loadWell(this.srcName);
    this.loadedDst = await loadWell(this.dstName);
    this.loadedTip = getTip(this.tipName);
  }

  simulateAndGenerateKeyFrames() {
    this.ctx = new SimContext(this.target, this.loadedLiquid, this.loadedTip, this.pipetteName, this.loadedSrc, this.loadedDst, this.srcVolume, this.dstVolume);
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