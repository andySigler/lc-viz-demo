class KeyFrame {
  constructor(time, tipZ, liquidInTipHeight, airInTipHeight, liquidInWellHeight) {
    this.time = time;
    this.tipZ = tipZ;
    this.liquidInTipHeight = liquidInTipHeight;
    this.airInTipHeight = airInTipHeight;
    this.liquidInWellHeight = liquidInWellHeight;
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
    if (this.isAspirate === false) {
      //
    }
    else {
      this.ctx.airGapRemove();
      this.add(1.0, this.submerge.tipStart);
    }
    this.add(this.submerge.duration(this.ctx), this.submerge.tipEnd);
    this.add(this.submerge.delay, this.submerge.tipEnd);

    if (this.isAspirate === true) {
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
    return this.keyFrames;
  }
}

class AspirateGenerator extends KeyFrameGenerator {
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

class SingleDispenseGenerator extends KeyFrameGenerator {
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


class TipView {
  constructor(tip, well, wellVolume, keyFrames) {
    this.tip = tip;
    this.well = well;
    this.wellVolume = wellVolume;
    this.keyFrames = keyFrames;
  }
}

class AspirateView extends TipView {
  constructor(tip, well, wellVolume, ctx) {
    let aspGen = new AspirateGenerator(ctx);
    super(tip, well, wellVolume, aspGen.generate());
  }
}

class SingleDispenseView extends TipView {
  constructor(tip, well, wellVolume, ctx) {
    let dspGen = new SingleDispenseGenerator(ctx);
    super(tip, well, wellVolume, dspGen.generate());
  }
}
