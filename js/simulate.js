import { getDelaySeconds, calcValueByVolume, getMixCount, getMixVolume } from './sharedData.js';


export const maxBlowOutP50 = 12;
export const maxBlowOutP1000 = 80;


class SimWell {
  constructor(well, liquidVolume) {
    this.totalLiquidVolume = well.totalLiquidVolume;
    this.depth = well.depth;
    this.currentVolume = liquidVolume;
  }

  getCurrentLiquidHeight() {
    return (this.currentVolume / this.totalLiquidVolume) * this.depth;
  }
}


class SimTip {
  constructor(tip) {
    this.length = tip.length;
    this.totalLiquidVolume = tip.totalLiquidVolume;
    this.currentVolume = 0.0;
    this.currentAir = 0.0;
    this.currentBlowOut = 0.0
  }

  getCurrentAirHeight() {
    return (this.currentAir / this.totalLiquidVolume) * this.length;
  }

  getCurrentLiquidHeight() {
    return this.getCurrentAirHeight() + (this.currentVolume / this.totalLiquidVolume) * this.length;
  }

  getCurrentBlowOutHeight() {
    return (this.currentBlowOut / this.totalLiquidVolume) * this.length;
  }
}


export class SimContext {
  constructor(target, liquid, tip, pipetteName, srcWell, dstWell, srcVolume, dstVolume) {
    this.target = target;
    this.liquid = liquid;
    this.pipetteName = pipetteName;

    this.tip = new SimTip(tip);

    this.srcWell = new SimWell(srcWell, srcVolume);
    this.dstWell = new SimWell(dstWell, dstVolume);
  }

  aspirate(ul, well) {
    well.currentVolume -= ul;
    this.tip.currentVolume += ul;
  }

  airGapAdd(ul) {
    this.tip.currentAir += ul;
  }

  airGapRemove() {
    this.tip.currentAir = 0.0;
  }

  dispense(ul, well, pushOut) {
    well.currentVolume += ul;
    this.tip.currentVolume -= ul;
    if (pushOut && this.tip.currentVolume > 0) {
      throw new Error(
        `tip must be empty when dispensing with pushOut,
         but would hold ${this.tip.currentVolume} uL`
      );
    }
    this.tip.currentBlowOut = pushOut;
    if (this.pipetteName.includes("50") && this.tip.currentBlowOut > maxBlowOutP50) {
      throw new Error(`${this.pipetteName} cannot exceed ${maxBlowOutP50} ul of push-out`);
    }
    else if (this.tip.currentBlowOut > maxBlowOutP1000) {
      throw new Error(`${this.pipetteName} cannot exceed ${maxBlowOutP1000} ul of push-out`);
    }
  }

  blowOut() {
    if (this.pipetteName.includes("50")) {
      this.tip.currentBlowOut = maxBlowOutP50;
    }
    else {
      this.tip.currentBlowOut = maxBlowOutP1000;
    }
  }

}


class Action {
  constructor(tipStart, tipEnd, delay) {
    this.tipStart = tipStart;
    this.tipEnd = tipEnd;
    this.delay = delay;
  }
}

class TipAction extends Action {
  constructor(tipStart, tipEnd, speed, delay) {
    super(tipStart, tipEnd, delay);
    this.speed = speed;
  }
  duration(simContext) {
    return Math.abs(this.tipStart - this.tipEnd) / this.speed;
  }
}

class LiquidAction extends Action {
  constructor(tipStart, tipEnd, flowRate, delay, mixCount, mixVolume) {
    super(tipStart, tipEnd, delay)
    this.flowRate = flowRate;
    this.mixCount = mixCount;
    this.mixVolume = mixVolume;
  }
  duration(simContext) {
    return simContext.target / this.flowRate;
  }
}

class SubmergeTipAction extends TipAction {
  constructor(tipStart, tipEnd, speed, delay) {
    super(tipStart, tipEnd, speed, delay);
  }
}

class RetractTipAction extends TipAction {
  constructor(tipStart, tipEnd, speed, delay, airGap) {
    super(tipStart, tipEnd, speed, delay);
    this.airGap = airGap;
  }
}


function calcTipMmFromBottom(well, position) {
  let mm = position.offset.z;
  switch (position.positionReference) {
    case "well-bottom":
      return mm;
    case "well-top":
      return mm + well.depth;
    case "liquid-meniscus":
      return mm + well.getCurrentLiquidHeight();
    default:
      throw new Error(`unexpected position reference: ${position.positionReference}`);
  }
}


export class AspirateSubmerge extends SubmergeTipAction {
  constructor(simContext) {
    let aspProps = simContext.liquid.aspirate;
    let tipStart = calcTipMmFromBottom(simContext.srcWell, aspProps.submerge.startPosition);
    let tipEnd = calcTipMmFromBottom(simContext.srcWell, aspProps.aspiratePosition);
    let speed = aspProps.submerge.speed;
    let delay = getDelaySeconds(aspProps.submerge.delay);
    super(tipStart, tipEnd, speed, delay);
  }
}

export class AspirateLiquid extends LiquidAction {
  constructor(simContext) {
    let aspProps = simContext.liquid.aspirate;
    let tipEnd = calcTipMmFromBottom(simContext.srcWell, aspProps.aspiratePosition);
    let tipStart = tipEnd;  // NOTE: not doing dynamic tracking for now
    let flowRate = calcValueByVolume(aspProps.flowRateByVolume, simContext.target);
    let delay = getDelaySeconds(aspProps.delay);
    let mixCount = getMixCount(aspProps.mix);
    let mixVolume = getMixVolume(aspProps.mix);
    super(tipStart, tipEnd, flowRate, delay, mixCount, mixVolume);
  }
}

export class AspirateRetract extends RetractTipAction {
  constructor(simContext) {
    let aspProps = simContext.liquid.aspirate;
    let tipStart = calcTipMmFromBottom(simContext.srcWell, aspProps.aspiratePosition);
    let tipEnd = calcTipMmFromBottom(simContext.srcWell, aspProps.retract.endPosition);
    let speed = aspProps.retract.speed;
    let delay = getDelaySeconds(aspProps.retract.delay);
    let airGap = calcValueByVolume(aspProps.retract.airGapByVolume, simContext.target);
    super(tipStart, tipEnd, speed, delay, airGap);
  }
}

export class SingleDispenseSubmerge extends SubmergeTipAction {
  constructor(simContext) {
    let dispProps = simContext.liquid.singleDispense;
    let tipStart = calcTipMmFromBottom(simContext.dstWell, dispProps.submerge.startPosition);
    let tipEnd = calcTipMmFromBottom(simContext.dstWell, dispProps.dispensePosition);
    let speed = dispProps.submerge.speed;
    let delay = getDelaySeconds(dispProps.submerge.delay);
    super(tipStart, tipEnd, speed, delay);
  }
}

export class SingleDispenseLiquid extends LiquidAction {
  constructor(simContext) {
    let dispProps = simContext.liquid.singleDispense;
    let tipEnd = calcTipMmFromBottom(simContext.dstWell, dispProps.dispensePosition);
    let tipStart = tipEnd;  // NOTE: not doing dynamic tracking for now
    let flowRate = calcValueByVolume(dispProps.flowRateByVolume, simContext.target);
    let delay = getDelaySeconds(dispProps.delay);
    let mixCount = getMixCount(dispProps.mix);
    let mixVolume = getMixVolume(dispProps.mix);
    super(tipStart, tipEnd, flowRate, delay, mixCount, mixVolume);
    this.pushOut = calcValueByVolume(dispProps.pushOutByVolume, simContext.target);
  }
}

export class SingleDispenseRetract extends RetractTipAction {
  constructor(simContext) {
    let dispProps = simContext.liquid.singleDispense;
    let tipStart = calcTipMmFromBottom(simContext.dstWell, dispProps.dispensePosition);
    let tipEnd = calcTipMmFromBottom(simContext.dstWell, dispProps.retract.endPosition);
    let speed = dispProps.retract.speed;
    let delay = getDelaySeconds(dispProps.retract.delay);
    let airGap = calcValueByVolume(dispProps.retract.airGapByVolume, simContext.target);
    super(tipStart, tipEnd, speed, delay, airGap);
    this.blowOut = dispProps.retract.blowout.enable;
  }
}
