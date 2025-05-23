import { availableLiquids, availablePipettes, availableTips, availableLabwares } from "./sharedData.js";
import { defaultColors, colorText } from './defaults.js';
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

function addLabeledInput(parent, labelText, inputElement) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.marginBottom = '4px';

  const label = document.createElement('label');
  label.textContent = labelText;
  label.style.marginRight = '8px';
  label.style.width = '200px';  // optional fixed width
  label.style.color = colorText;

  wrapper.appendChild(label);
  wrapper.appendChild(inputElement);
  parent.appendChild(wrapper);
}

export function createDomUI(parentId, defaults, onNewConfig) {
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

  const buildNewConfig = () => {
    const newCfg = new ViewConfig({
      target: Number(inputTarget.value),
      liquidName: dropdownLiquids.value,
      tipName: dropdownTips.value,
      pipetteName: dropdownPipettes.value,
      srcName: dropdownSources.value,
      dstName: dropdownDestinations.value,
      srcStartVolume: Number(inputSrcVolume.value),
      dstStartVolume: Number(inputDstVolume.value),
      colors: defaultColors
    });
    onNewConfig(newCfg);
  }

  dropdownLiquids.addEventListener("change", buildNewConfig);
  dropdownPipettes.addEventListener("change", buildNewConfig);
  dropdownTips.addEventListener("change", buildNewConfig);
  dropdownSources.addEventListener("change", buildNewConfig);
  dropdownDestinations.addEventListener("change", buildNewConfig);
  inputTarget.addEventListener("change", buildNewConfig);
  inputSrcVolume.addEventListener("change", buildNewConfig);
  inputDstVolume.addEventListener("change", buildNewConfig);

  addLabeledInput(parent, "Target Volume", inputTarget);
  addLabeledInput(parent, "Liquid", dropdownLiquids);
  addLabeledInput(parent, "Pipette", dropdownPipettes);
  addLabeledInput(parent, "Tip", dropdownTips);
  addLabeledInput(parent, "Source Labware", dropdownSources);
  addLabeledInput(parent, " - Start uL", inputSrcVolume);
  addLabeledInput(parent, "Destination Labware", dropdownDestinations);
  addLabeledInput(parent, " - Start uL", inputDstVolume);
}
