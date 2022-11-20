// - Ajouter multi-ligne

const HOST_URL = 'http://localhost:1337';
const API_URL = HOST_URL + '/api';
const PX_TO_CM = 0.0375;
const DEVICE_PIXEL_RATIO = 2;
const CANVAS_HEIGHT = 80;

let selectedColor = null
let selectedFont = null
let selectedOptions = [];
let selectedHeightOption = null;
let selectedAspectOption = null;
let selectedAlignOption = null;
let selectedQuantity = 1;
let enabledMultiline = false;

let colorCategories = [];
let colors = [];

let fontCategories = [];
let fonts = [];
let prices = [];

let widthCanvas = 0;
let heightCanvas = 0;
let aspectScale = 1;

const canvas = document.getElementById('js-canvas')
const ctx = canvas.getContext('2d')

const multilineBtn = document.getElementById('multiline-btn');

const ruleTop = document.getElementById('rule-top');
const ruleLeft = document.getElementById('rule-left');

const metricsHeight = document.getElementById('metrics-height')
const metricsWidth = document.getElementById('metrics-width')

const textInput = document.getElementById('text-input')
const textArea = document.getElementById('text-area');

const aspectModule = document.getElementById('aspect-module');
const heightModule = document.getElementById('height-module');
const alignModule = document.getElementById('align-module');

const heightInput = document.getElementById('height-input')
const widthInput = document.getElementById('width-input')

const fontSelect = document.getElementById('font-select')
const fontSelectName = document.getElementById('font-select-name')
const fontSelectArrow = document.getElementById('font-select-arrow')
const fontSelector = document.getElementById('font-selector')

const colorSelect = document.getElementById('color-select')
const colorSelectArrow = document.getElementById('color-select-arrow')
const colorSelectName = document.getElementById('color-select-name')
const colorSelectCircle = document.getElementById('color-select-circle')
const colorSelector = document.getElementById('color-selector')
const keepAspectCheckbox = document.getElementById('keep-aspect-checkbox');

const quantityBtns = document.querySelectorAll('.quantity-btn')
const quantityAmount = document.getElementById('quantity-amount')

const options = document.querySelectorAll('#options .control-options-item')
const heightOptions = document.querySelectorAll('#height-options .control-options-item')
const aspectOptions = document.querySelectorAll('#aspect-options .control-options-item')
const alignOptions = document.querySelectorAll('#align-options .control-options-item')

/* -- start of buisness -- */
/*********************************************************************************** */
const boot = async () => {
  await initColorCategories();
  await initColors();
  await initFontCategories();
  await initFonts();
  await initPrices();

  multilineBtn.addEventListener('click', () => enableMultiline(!enabledMultiline));
  colorSelect.addEventListener('click', handleColorSelectClicked)
  fontSelect.addEventListener('click', handleFontSelectClicked)

  for (const quantityBtn of quantityBtns) {
    quantityBtn.addEventListener('click', (e) => handleQuantityClicked(e))
  }

  for (const option of options) {
    option.addEventListener('click', (e) => selectOption(e.target.id));
  }

  for (const option of heightOptions) {
    option.addEventListener('click', (e) => selectHeightOption(e.target.id));
  }

  for (const option of aspectOptions) {
    option.addEventListener('click', (e) => selectAspectOption(e.target.id));
  }

  for (const option of alignOptions) {
    option.addEventListener('click', (e) => selectAlignOption(e.target.id));
  }

  widthInput.addEventListener('keyup', handleWidthInputChanged);
  heightInput.addEventListener('keyup', handleHeightInputChanged);

  window.requestAnimationFrame(run);

  selectColor(colors[0].id);
  selectFont(fonts[0].id);
  selectHeightOption('body');
  selectAspectOption('yes');
  selectAlignOption('left');
  enableMultiline(false);
}

const initColorCategories = async () => {
  const res = await fetch(`${API_URL}/color-categories`);
  const json = await res.json();
  colorCategories = json.data;

  for (const colorCategory of colorCategories) {
    colorSelector.innerHTML += `
    <div class="selector-colors-category">
      <div class="selector-colors-category-title">${colorCategory.attributes.label}</div>
      <div id="color-category-${colorCategory.id}" class="selector-colors-list"></div>
    </div>`
  }
}

const initColors = async () => {
  const res = await fetch(`${API_URL}/colors?populate=color_category`);
  const json = await res.json();
  colors = json.data;

  for (const color of colors) {
    const parent = document.getElementById('color-category-' + color.attributes.color_category.data.id)
    const div = document.createElement('div')
    div.style.backgroundColor = color.attributes.color
    div.className = `selector-colors-list-item ${color.attributes.color}`
    div.id = 'color-' + color.id;
    div.addEventListener('click', (e) => selectColor(color.id))
    parent.appendChild(div)
  }
}

const initFontCategories = async () => {
  const res = await fetch(`${API_URL}/font-categories`);
  const json = await res.json();
  fontCategories = json.data;

  for (const fontCategory of fontCategories) {
    fontSelector.innerHTML += `
    <div class="selector-fonts-category">
      <div class="selector-fonts-category-title">${fontCategory.attributes.label}</div>
      <div id="font-category-${fontCategory.id}" class="selector-fonts-list"></div>
    </div>`
  }
}

const initFonts = async () => {
  const res = await fetch(`${API_URL}/fonts?populate=file,font_category`);
  const json = await res.json();
  fonts = json.data;

  for (const font of fonts) {
    const parent = document.getElementById('font-category-' + font.attributes.font_category.data.id)
    const img = document.createElement('img');
    img.className = 'selector-fonts-list-item';
    img.src = HOST_URL + '/font-previews/' + font.attributes.file.data.attributes.hash + '.png';
    img.id = 'font-' + font.id;
    img.addEventListener('click', (e) => selectFont(font.id));
    parent.appendChild(img);
  }
}

const initPrices = async () => {
  const res = await fetch(`${API_URL}/prices`);
  const json = await res.json();
  prices = json.data;
}

const run = () => {
  updateSingleLine();
  updateMultiLine();
  updateIndicators();
  window.requestAnimationFrame(run);
}

const selectFont = (fontID) => {
  const font = fonts.find(f => f.id == fontID)
  if (font === selectedFont) {
    return
  }

  const prevFont = document.querySelector('.selector-fonts-list-item.active')
  if (prevFont) {
    prevFont.classList.toggle('active')
  }

  document.getElementById('font-' + fontID).classList.add('active')
  fontSelectName.innerText = font.attributes.label;

  let f = new FontFace(font.attributes.label, `url(${HOST_URL}${font.attributes.file.data.attributes.url})`);
  f.load().then((fontFace) => {
    document.fonts.add(fontFace);
    selectedFont = font;
  });
}

const selectColor = (colorID) => {
  const color = colors.find(c => c.id == colorID)
  if (color === selectedColor) {
    return
  }

  const prevColor = document.querySelector('.selector-colors-list-item.active')
  if (prevColor) {
    prevColor.classList.toggle('active')
  }

  if (color.attributes.type == 'light') {
    canvas.classList.add('bg-black');
  }
  else {
    canvas.classList.remove('bg-black');
  }

  document.getElementById('color-' + colorID).classList.add('active')
  colorSelectName.innerText = color.attributes.label
  colorSelectCircle.style.backgroundColor = color.attributes.color;
  selectedColor = color
}

const selectOption = (optionID) => {
  const selectedIndex = selectedOptions.indexOf(optionID);
  if (selectedIndex != -1) {
    selectedOptions.splice(selectedIndex, 1)
  }
  else {
    selectedOptions.push(optionID)
  }

  if (optionID == 'pochoir') {
    canvas.classList.toggle('bg-pochoir');
  }

  document.getElementById(optionID).classList.toggle('active')
}

const selectHeightOption = (optionID) => {
  if (selectedHeightOption) {
    const optionEl = document.getElementById(selectedHeightOption)
    optionEl.classList.remove('active');
  }

  selectedHeightOption = optionID;
  document.getElementById(optionID).classList.add('active')
}

const selectAspectOption = (optionID) => {
  if (selectedAspectOption) {
    const optionEl = document.getElementById(selectedAspectOption)
    optionEl.classList.remove('active');
  }

  selectedAspectOption = optionID;
  document.getElementById(optionID).classList.add('active')
}

const selectAlignOption = (optionID) => {
  if (selectedAlignOption) {
    const optionEl = document.getElementById(selectedAlignOption)
    optionEl.classList.remove('active');
  }

  selectedAlignOption = optionID;
  document.getElementById(optionID).classList.add('active')
}

const enableMultiline = (enable) => {
  if (enable) {
    multilineBtn.classList.toggle('active');
    heightModule.style.display = 'none';
    aspectModule.style.display = 'none';
    alignModule.style.display = 'block';
    textInput.style.display = 'none';
    textArea.style.display = 'block';
    enabledMultiline = true;
    selectHeightOption('strict');
  }
  else {
    multilineBtn.classList.toggle('active');
    heightModule.style.display = 'block';
    aspectModule.style.display = 'block';
    alignModule.style.display = 'none';
    textInput.style.display = 'block';
    textArea.style.display = 'none';
    enabledMultiline = false;
    selectHeightOption('body');
  }
}

const handleWidthInputChanged = () => {
  if (selectedAspectOption == 'yes') {
    const aabb = canvas.getBoundingClientRect();
    const wcm = aabb.width * PX_TO_CM;
    aspectScale = widthInput.value / wcm;
  }
  else {
    const scaleDown = canvas.height / (heightInput.value / PX_TO_CM);
    widthCanvas = (widthInput.value / PX_TO_CM) * scaleDown;
  }
}

const handleHeightInputChanged = () => {
  if (selectedAspectOption == 'yes') {
    const aabb = canvas.getBoundingClientRect();
    const hcm = aabb.height * PX_TO_CM;
    aspectScale = heightInput.value / hcm;
  }
  else {
    const scaleDown = canvas.height / (heightInput.value / PX_TO_CM);
    widthCanvas = (widthInput.value / PX_TO_CM) * scaleDown;
  }
}

const handleColorSelectClicked = () => {
  colorSelector.classList.toggle('selector-colors--visible')
  colorSelectArrow.classList.toggle('activated')
}

const handleFontSelectClicked = () => {
  fontSelector.classList.toggle('selector-fonts--visible')
  fontSelectArrow.classList.toggle('activated')
}

const handleQuantityClicked = (e) => {
  if (e.target.id === 'remove' && selectedQuantity <= 1) {
    return
  }

  if (e.target.id === 'remove') {
    selectedQuantity--
  }
  else {
    selectedQuantity++
  }

  quantityAmount.innerText = selectedQuantity
}

const updateSingleLine = () => {
  if (enabledMultiline) {
    return;
  }

  ctx.save();

  const text = textInput.value.trim();
  const metrics = ctx.measureText(text);
  const actualTextHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const fontTextHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  const actualToFontHeight = fontTextHeight / actualTextHeight

  if (selectedAspectOption == 'yes') {
    heightCanvas = fontTextHeight;
    widthCanvas = selectedHeightOption == 'body' ? metrics.width : metrics.width * actualToFontHeight;
  }

  canvas.width = widthCanvas;
  canvas.height = heightCanvas;
  canvas.style.width = canvas.width * (CANVAS_HEIGHT / heightCanvas) + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';

  const fontFamily = selectedFont ? selectedFont.attributes.label : 'Arial';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '160px ' + fontFamily;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  if (selectedAspectOption == 'yes' && selectedHeightOption == 'body') {
    const actualTextY = (canvas.height - actualTextHeight) / 2;

    ctx.beginPath();
    ctx.moveTo(0, actualTextY);
    ctx.lineTo(canvas.width, actualTextY);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, actualTextY + actualTextHeight);
    ctx.lineTo(canvas.width, actualTextY + actualTextHeight);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
  }

  if (selectedOptions.includes('inversed')) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }

  if (selectedOptions.includes('pochoir')) {
    ctx.fillStyle = '#fff';
  }
  else {
    ctx.fillStyle = selectedColor ? selectedColor.attributes.color : '#000';
  }

  if (selectedAspectOption == 'no') {
    ctx.scale(canvas.width / metrics.width, actualToFontHeight);
    ctx.fillText(text, 0, metrics.actualBoundingBoxAscent);
  }
  else if (selectedHeightOption == 'body') {
    ctx.fillText(text, 0, metrics.actualBoundingBoxAscent + ((canvas.height - actualTextHeight) / 2));
  }
  else {
    ctx.scale(actualToFontHeight, actualToFontHeight);
    ctx.fillText(text, 0, metrics.actualBoundingBoxAscent);
  }

  ctx.restore();
}

const updateMultiLine = () => {
  if (!enabledMultiline) {
    return;
  }

  ctx.save();

  let texts = textArea.value.split('\n');
  texts = texts.filter(t => t != '');

  let totalWidth = 0;
  let totalHeight = 0;

  for (let i = 0; i < texts.length; i++) {
    const metrics = ctx.measureText(texts[i])
    totalHeight += (i == texts.length - 1) ? metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent : metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    totalWidth = (metrics.width > totalWidth) ? metrics.width : totalWidth;
  }

  if (selectedAspectOption == 'yes') {
    heightCanvas = totalHeight;
    widthCanvas = totalWidth;
  }

  canvas.width = widthCanvas;
  canvas.height = heightCanvas;

  // canvasElementHeight / heightCanvas is used to convert width to conform with fixed canvas height ref (80px for each line)
  const canvasElementHeight = CANVAS_HEIGHT * texts.length;
  canvas.style.width = canvas.width * (canvasElementHeight / heightCanvas) + 'px';
  canvas.style.height = canvasElementHeight + 'px';

  const fontFamily = selectedFont ? selectedFont.attributes.label : 'Arial';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '160px ' + fontFamily;
  ctx.textBaseline = 'top';
  ctx.textAlign = selectedAlignOption;

  if (selectedOptions.includes('inversed')) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }

  if (selectedOptions.includes('pochoir')) {
    ctx.fillStyle = '#fff';
  }
  else {
    ctx.fillStyle = selectedColor ? selectedColor.attributes.color : '#000';
  }

  let x = 0;
  let y = 0;

  for (let i = 0; i < texts.length; i++) {
    const metrics = ctx.measureText(texts[i]);

    if (selectedAlignOption == 'left') {
      x = 0;
    }
    else if (selectedAlignOption == 'center') {
      x = canvas.width / 2;
    }
    else {
      x = canvas.width;
    }

    ctx.fillText(texts[i], x, y + metrics.actualBoundingBoxAscent);
    y += metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  }

  ctx.restore();
}

const updateIndicators = () => {
  ruleTop.style.width = canvas.style.width;
  ruleLeft.style.height = canvas.style.height;

  if (selectedAspectOption == 'yes' && document.activeElement != widthInput) {
    const aabb = canvas.getBoundingClientRect();
    widthInput.value = Number.parseFloat(aabb.width * aspectScale * PX_TO_CM).toFixed(2);
  }

  if (selectedAspectOption == 'yes' && document.activeElement != heightInput) {
    const aabb = canvas.getBoundingClientRect();
    heightInput.value = Number.parseFloat(aabb.height * aspectScale * PX_TO_CM).toFixed(2);
  }

  metricsHeight.innerText = heightInput.value + ' cm';
  metricsWidth.innerText = widthInput.value + ' cm';
}

const getCheckout = () => {
  const cmSquared = widthInput.value * heightInput.value;
  const priceFound = prices.find(p => cmSquared >= p.attributes.cmeter_surface_min && cmSquared <= p.attributes.cmeter_surface_max);
  if (!priceFound) {
    throw new Error('Price slice not found !');
  }

  return {
    text: textInput.value,
    color: selectedColor.attributes.color,
    width: widthInput.value,
    height: heightInput.value,
    heightOption: selectedHeightOption,
    aspectOption: selectedAspectOption,
    options: selectedOptions,
    quantity: selectedQuantity,
    price: Number(cmSquared * priceFound.attributes.cmeter_square_price * selectedQuantity).toFixed(2)
  }
}

boot();