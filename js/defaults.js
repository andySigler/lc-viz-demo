import { t50, p50S, well2ml, well360ul } from './sharedData.js';
import { ViewCfg } from './view.js';


export const defaultView = new ViewCfg({
  target: 40,
  liquidName: "water",
  tipName: t50,
  pipetteName: p50S,
  srcName: well2ml,
  dstName: well360ul,
  srcStartVolume: 1000.0,
  dstStartVolume: 0.0,
});
