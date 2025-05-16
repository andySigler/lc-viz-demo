const labwareDir = "shared-data/labware/";
const liquidClassDir = "shared-data/liquid-class/";

const water = "water";
const ethanol80 = "ethanol_80";
const glycerol50 = "glycerol_50";

const t50 = "opentrons_flex_96_tiprack_50ul";
const t200 = "opentrons_flex_96_tiprack_200ul";
const t1000 = "opentrons_flex_96_tiprack_1000ul";

const p50S = "flex_1channel_50";
const p50M = "flex_8channel_50";
const p1000S = "flex_1channel_1000";
const p1000M = "flex_8channel_1000";
const p1000H = "flex_96channel_1000";

const well112ul = "corning_384_wellplate_112ul_flat";
const well200ul = "opentrons_96_wellplate_200ul_pcr_full_skirt";
const well360ul = "corning_96_wellplate_360ul_flat";
const well2ml = "nest_96_wellplate_2ml_deep";
const tube2ml = "opentrons_24_tuberack_nest_2ml_screwcap";
const tube50ml = "opentrons_6_tuberack_nest_50ml_conical";
const tube15ml = "opentrons_15_tuberack_nest_15ml_conical";
const reservoir15ml = "nest_12_reservoir_15ml";
const reservoir290ml = "nest_1_reservoir_290ml";


function loadLiquid(liquidName, pipetteName, tipName, cb) {
    loadJSON(`${liquidClassDir}${liquidName}.json`, (liquidDef) => {
        let byPipette = liquidDef.byPipette;
        for (let i = 0; i < byPipette.length; i++) {
            if (byPipette[i].pipetteModel === pipetteName) {
                let byTip = byPipette[i].byTipType;
                for (let n = 0; n < byTip.length; n++) {
                    if (byTip[n].tiprack == `opentrons/${tipName}/1`) {
                        cb(byTip[n]);
                        return;
                    }
                }
            }
        }
        throw new Error(`unable to find ${liquidName} settings`);
    })
}


function loadWell(name, cb) {
    loadJSON(`${labwareDir}${name}.json`, (labwareDef) => {
        cb(labwareDef.wells.A1)
    });
}


function getTip(name) {
    if (name == t50) {
        return {"length": 50.0, "maxVolume": 50.0};
    }
    else if (name == t200) {
        return {"length": 60.0, "maxVolume": 200.0};
    }
    else if (name == t1000) {
        return {"length": 80.0, "maxVolume": 1000.0};
    }
}


function getDelaySeconds(delay) {
  if (delay.enable === true) {
    return delay.params.duration;
  }
  return 0.0;
}


function getMixCount(mix) {
  if (mix.enable === true) {
    return mix.params.repetitions;
  }
  return 0.0;
}


function getMixVolume(mix) {
  if (mix.enable === true) {
    return mix.params.volume;
  }
  return 0.0;
}


function calcValueByVolume(valueByVolume, volume) {
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
