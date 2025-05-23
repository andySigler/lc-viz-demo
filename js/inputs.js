import { availableLiquids, availablePipettes, availableTips, availableLabwares } from "./sharedData.js";
import { defaultColors } from './defaults.js';
import { ViewConfig } from './view.js';


function createDropdown(options = []) {
  const select = document.createElement('select');

  for (const optionText of options) {
    const option = document.createElement('option');
    option.value = optionText;
    option.textContent = optionText;
    select.appendChild(option);
  }

  return select;
}

export function createDomUI(parentId, defaults) {
  const parent = document.getElementById(parentId);
  if (!parent) {
    throw new Error(`Parent element with id "${parentId}" not found.`);
  }
  if (parent.childNodes.length > 0) {
    throw new Error(`Parent element with id "${parentId}" not found.`);
  }

  const dropdownLiquids = createDropdown(availableLiquids);
  const dropdownPipettes = createDropdown(availablePipettes);
  const dropdownTips = createDropdown(availableTips);
  const dropdownSources = createDropdown(availableLabwares);
  const dropdownDestinations = createDropdown(availableLabwares);

  const inputTarget = document.createElement('input');
  const inputSrcVolume = document.createElement('input');
  const inputDstVolume = document.createElement('input');
  
  inputTarget.type = 'number';
  inputSrcVolume.type = 'number';
  inputDstVolume.type = 'number';

  inputTarget.value = defaults.target;
  inputSrcVolume.value = defaults.srcStartVolume;
  inputDstVolume.value = defaults.dstStartVolume;
  dropdownLiquids.value = defaults.liquidName;
  dropdownPipettes.value = defaults.pipetteName;
  dropdownTips.value = defaults.tipName;
  dropdownSources.value = defaults.srcName;
  dropdownDestinations.value = defaults.dstName;

  const buildNewConfig = async () => {
    const newCfg = new ViewConfig({
      target: inputTarget.value,
      liquidName: dropdownLiquids.value,
      tipName: dropdownTips.value,
      pipetteName: dropdownPipettes.value,
      srcName: dropdownSources.value,
      dstName: dropdownDestinations.value,
      srcStartVolume: inputSrcVolume.value,
      dstStartVolume: inputDstVolume.value,
      colors: defaultColors
    });
    await changeView(newCfg);
  }

  dropdownLiquids.addEventListener("change", buildNewConfig);
  dropdownPipettes.addEventListener("change", buildNewConfig);
  dropdownTips.addEventListener("change", buildNewConfig);
  dropdownSources.addEventListener("change", buildNewConfig);
  dropdownDestinations.addEventListener("change", buildNewConfig);
  inputTarget.addEventListener("change", buildNewConfig);
  inputSrcVolume.addEventListener("change", buildNewConfig);
  inputDstVolume.addEventListener("change", buildNewConfig);

  parent.appendChild(dropdownLiquids);
  parent.appendChild(dropdownPipettes);
  parent.appendChild(dropdownTips);
  parent.appendChild(dropdownSources);
  parent.appendChild(dropdownDestinations);
  parent.appendChild(inputTarget);
  parent.appendChild(inputSrcVolume);
  parent.appendChild(inputDstVolume);
}
