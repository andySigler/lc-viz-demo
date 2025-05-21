export const labwareDir = "shared-data/labware/";
export const liquidClassDir = "shared-data/liquid-class/";

export const water = "water";
export const ethanol80 = "ethanol_80";
export const glycerol50 = "glycerol_50";

export const t50 = "opentrons_flex_96_tiprack_50ul";
export const t200 = "opentrons_flex_96_tiprack_200ul";
export const t1000 = "opentrons_flex_96_tiprack_1000ul";

export const p50S = "flex_1channel_50";
export const p50M = "flex_8channel_50";
export const p1000S = "flex_1channel_1000";
export const p1000M = "flex_8channel_1000";
export const p1000H = "flex_96channel_1000";

export const well112ul = "corning_384_wellplate_112ul_flat";
export const well200ul = "opentrons_96_wellplate_200ul_pcr_full_skirt";
export const well360ul = "corning_96_wellplate_360ul_flat";
export const well2ml = "nest_96_wellplate_2ml_deep";
export const tube2ml = "opentrons_24_tuberack_nest_2ml_screwcap";
export const tube50ml = "opentrons_6_tuberack_nest_50ml_conical";
export const tube15ml = "opentrons_15_tuberack_nest_15ml_conical";
export const reservoir15ml = "nest_12_reservoir_15ml";
export const reservoir290ml = "nest_1_reservoir_290ml";


export class TransitionPoint {
  constructor(distanceFromBottom, width, uLFromBottom) {
    this.distanceFromBottom = distanceFromBottom;
    this.width = width;
    this.uLFromBottom = uLFromBottom;
  }

  asPixels(mmPerPixel) {
    return new TransitionPoint(
      this.distanceFromBottom / mmPerPixel,
      this.width / mmPerPixel,
      this.uLFromBottom / mmPerPixel
    );
  }

  static buildFromSection(s, uL, isTop = false) {
    if (!isTop) {
      if (s.shape === "conical") {
        return new TransitionPoint(s.bottomHeight, s.bottomDiameter, uL);
      }
      else if (s.shape === "cuboidal") {
        return new TransitionPoint(s.bottomHeight, s.bottomXDimension, uL);
      }
      else if (s.shape === "spherical") {
        return new TransitionPoint(0.0, 0.0, uL);  // NOTE: ignoring spheres
      }
      else {
        throw new Error(`unexpected shape: ${s.shape}`);
      }
    }
    else {
      if (s.shape === "conical") {
        return new TransitionPoint(s.topHeight, s.topDiameter, uL);
      }
      else if (s.shape === "cuboidal") {
        return new TransitionPoint(s.topHeight, s.topXDimension, uL);
      }
      else {
        throw new Error(`unexpected shape: ${s.shape}`);
      }
    }
  }
}


async function _loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return await response.json();
}


export async function loadLiquid(liquidName, pipetteName, tipName) {
  const liquidDef = await _loadJSON(`${liquidClassDir}${liquidName}.json`);
  let byPipette = liquidDef.byPipette;
  for (let i = 0; i < byPipette.length; i++) {
    if (byPipette[i].pipetteModel === pipetteName) {
      let byTip = byPipette[i].byTipType;
      for (let n = 0; n < byTip.length; n++) {
        if (byTip[n].tiprack == `opentrons/${tipName}/1`) {
          return byTip[n];
        }
      }
    }
  }
  throw new Error(`unable to find ${liquidName} settings`);
}


export async function loadWell(name) {
  const labwareDef = await _loadJSON(`${labwareDir}${name}.json`);
  let well = labwareDef.wells.A1;
  well.loadName = name;

  // NOTE: converting innerWellGeometries to "transitionPoints"
  //       to make it simpler for me (sigler)
  let sections = undefined;
  if (labwareDef.innerLabwareGeometry.flatWell) {
    sections = labwareDef.innerLabwareGeometry.flatWell.sections;
  }
  else if (labwareDef.innerLabwareGeometry.cuboidalWell) {
    sections = labwareDef.innerLabwareGeometry.cuboidalWell.sections;
  }
  else if (labwareDef.innerLabwareGeometry.conicalWell) {
    sections = labwareDef.innerLabwareGeometry.conicalWell.sections;
  }
  else {
    throw new Error("found a innerLabwareGeometry section we do not yet support");
  }
  sections.sort((a, b) => a.bottomHeight - b.bottomHeight);

  // TODO: don't fake this, get real numbers by simulating API
  let uLAdder = well.totalLiquidVolume / sections.length;
  let uLCounter = 0.0;

  well.transitionPoints = []
  for (let i = 0; i < sections.length; i++) {
    well.transitionPoints.push(
      TransitionPoint.buildFromSection(sections[i], uLCounter, false)
    );
    uLCounter += uLAdder;  // TODO: don't fake this
  }
  well.transitionPoints.push(
    TransitionPoint.buildFromSection(
      sections[sections.length - 1], well.totalLiquidVolume, true
    )
  );
  return well;
}


export function getTip(name) {
  // TODO: don't fake this, get real numbers from either Starno or Smith
  if (name == t50) {
    return {
      "length": 50.0,
      "totalLiquidVolume": 50.0,
      "transitionPoints": [
        new TransitionPoint(0.0, 1.0, 0.0),
        new TransitionPoint(50.0, 6.0, 50.0)
      ]
    };
  }
  else if (name == t200) {
    return {
      "length": 50.0,
      "totalLiquidVolume": 200.0,
      "transitionPoints": [
        new TransitionPoint(0.0, 1.0, 0.0),
        new TransitionPoint(50.0, 6.0, 200.0)
      ]
    };
  }
  else if (name == t1000) {
    return {
      "length": 70.0,
      "totalLiquidVolume": 1000.0,
      "transitionPoints": [
        new TransitionPoint(0.0, 1.0, 0.0),
        new TransitionPoint(70.0, 6.0, 1000.0)
      ]
    };
  }
}


export function getDelaySeconds(delay) {
  if (delay.enable === true) {
    return delay.params.duration;
  }
  return 0.0;
}


export function getMixCount(mix) {
  if (mix.enable === true) {
    return mix.params.repetitions;
  }
  return 0.0;
}


export function getMixVolume(mix) {
  if (mix.enable === true) {
    return mix.params.volume;
  }
  return 0.0;
}


export function calcValueByVolume(valueByVolume, volume) {
  const length = valueByVolume.length;
  valueByVolume.sort((a, b) => a[0] - b[0]);
  if (volume <= valueByVolume[0][0]) {
    return valueByVolume[0][1];
  }
  if (volume >= valueByVolume[length - 1][0]) {
    return valueByVolume[length - 1][1];
  }
  for (let i = 0; i < length; i++) {
    if (volume === valueByVolume[i][0]) {
      return valueByVolume[i][1];
    }
  }
  // interpolation
  for (let i = 0; i < length - 1; i++) {
    let x1 = valueByVolume[i][0];
    let y1 = valueByVolume[i][1];
    let x2 = valueByVolume[i + 1][0];
    let y2 = valueByVolume[i + 1][1];
    if (volume > x1 && volume < x2) {
      let t = (volume - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
}
