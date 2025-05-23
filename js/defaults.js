import { t50, p50S, well2ml, well360ul } from './sharedData.js';
import { ViewConfig } from './view.js';
import { VesselColors } from './vessel.js';

const colorWhite = "rgb(251, 250, 248)";
const colorBlack = "rgb(4, 15, 15)";
const colorGrey = "rgb(181, 194, 183)";
const colorRed = "rgb(255, 73, 92)";
const colorGreen = "rgb(61, 220, 151)";
const colorGreenPale = "rgb(105, 143, 63)";
const colorBlue = "rgb(0, 108, 250)";
const colorBluePale = "rgb(120, 178, 255)";
const colorPurple = "rgb(199, 170, 238)";
const colorYellow = "rgb(255, 253, 130)";
const colorOrange = "rgb(249, 166, 32)";

const colorPlastic = colorGrey;
const colorLiquid = colorBlue;
const colorFlow = colorBluePale;
const colorOutline = colorBlack;
const colorBackground = "rgba(0, 0, 0, 0)";


export const defaultColors = new VesselColors(colorPlastic, colorLiquid, colorFlow, colorOutline, colorBackground);


export const defaultView = new ViewConfig({
  target: 30,
  liquidName: "ethanol_80",
  tipName: t50,
  pipetteName: p50S,
  srcName: well2ml,
  dstName: well360ul,
  srcStartVolume: 1000.0,
  dstStartVolume: 0.0,
  colors: defaultColors
});
