import { AspirateSubmerge, AspirateLiquid, AspirateRetract } from './simulate.js';
import { SingleDispenseSubmerge, SingleDispenseLiquid, SingleDispenseRetract } from './simulate.js';

class KeyFrame {
  constructor(time, tipZ, liquidInTipHeight, airInTipHeight, liquidInWellHeight) {
    this.time = time;
    this.tipZ = tipZ;
    this.liquidInTipHeight = liquidInTipHeight;
    this.airInTipHeight = airInTipHeight;
    this.liquidInWellHeight = liquidInWellHeight;
  }

  asPixels(mmPerPixel, secondsPerPixel) {
    return new KeyFrame(
      this.time / secondsPerPixel,
      this.tipZ / mmPerPixel,
      this.liquidInTipHeight / mmPerPixel,
      this.airInTipHeight / mmPerPixel,
      this.liquidInWellHeight / mmPerPixel,
    )
  }

  liquidHeight(isWell) {
    if (isWell) {
      return this.liquidInWellHeight;
    }
    return this.liquidInTipHeight;
  }

  airHeight(isWell) {
    if (isWell) {
      return 0.0;
    }
    return this.airInTipHeight;
  }
}

class KeyFrameGenerator {
  constructor(simContext, submerge, liquid, retract, isAspirate) {
    this.ctx = simContext;
    this.time = 0.0;
    this.keyFrames = [];
    this.submerge = submerge;
    this.liquid = liquid;
    this.retract = retract;
    this.isAspirate = isAspirate;
  }

  add(duration, tipZ) {
    if (duration === 0.0 && this.keyFrames.length > 0) {
      return;
    }
    this.time += duration;
    let wellLiqHeight = 0.0;
    if (this.isAspirate) {
      wellLiqHeight = this.ctx.srcWell.getCurrentLiquidHeight();
    }
    else {
      wellLiqHeight = this.ctx.dstWell.getCurrentLiquidHeight();
    }
    let newKeyFrame = new KeyFrame(
      this.time,
      tipZ,
      this.ctx.tip.getCurrentLiquidHeight(),
      this.ctx.tip.getCurrentAirHeight(),
      wellLiqHeight
    )
    this.keyFrames.push(newKeyFrame)
  }

  generateKeyFrames() {
    this.add(0.0, this.submerge.tipStart);
    if (!this.isAspirate) {
      this.ctx.airGapRemove();
      this.add(1.0, this.submerge.tipStart);
    }
    this.add(this.submerge.duration(this.ctx), this.submerge.tipEnd);
    this.add(this.submerge.delay, this.submerge.tipEnd);

    if (this.isAspirate) {
      this.ctx.aspirate(this.ctx.target, this.ctx.srcWell);
    }
    else {
      this.ctx.dispense(this.ctx.target, this.ctx.dstWell, this.liquid.pushOut);
    }
    this.add(this.liquid.duration(this.ctx), this.liquid.tipEnd);
    this.add(this.liquid.delay, this.liquid.tipEnd);
    this.add(this.retract.duration(this.ctx), this.retract.tipEnd);
    this.add(this.retract.delay, this.retract.tipEnd);
    if (this.isAspirate === true) {
      this.ctx.airGapAdd(this.retract.airGap);
      this.add(1.0, this.retract.tipEnd);
    }
    else {
      if(this.retract.blowOut) {
        this.ctx.blowOut();
        // TODO: need to configure max push-out per pipette-type
      }
    }
    this.keyFrames.sort((a, b) => a.time - b.time);
    return this.keyFrames;
  }
}

export class AspirateKeyFrameGenerator extends KeyFrameGenerator {
  constructor(simContext) {
    let submerge = new AspirateSubmerge(simContext);
    let liquid = new AspirateLiquid(simContext);
    let retract = new AspirateRetract(simContext);
    super(simContext, submerge, liquid, retract, true);
  }
  generate() {
    return this.generateKeyFrames();
  }
}

export class SingleDispenseKeyFrameGenerator extends KeyFrameGenerator {
  constructor(simContext) {
    let submerge = new SingleDispenseSubmerge(simContext);
    let liquid = new SingleDispenseLiquid(simContext);
    let retract = new SingleDispenseRetract(simContext);
    super(simContext, submerge, liquid, retract, false);
  }
  generate() {
    return this.generateKeyFrames();
  }
}
