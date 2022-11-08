const HOST_URL = 'http://localhost:1337';
const API_URL = HOST_URL + '/api';
const PX_TO_CM = 0.0352;
const SIZE_BASE = 250;
const DEVICE_PIXEL_RATIO = 2;

let selectedColor = null
let selectedFont = null
let selectedOptions = [];
let selectedHeightOption = null;

let colorCategories = [];
let colors = [];

let fontCategories = [];
let fonts = [];

let homotheticScale = 1;
let width = 0;
let height = 0;

const canvas = document.getElementById('js-canvas')
const ctx = canvas.getContext('2d')
const metricsHeight = document.getElementById('metrics-height')
const metricsWidth = document.getElementById('metrics-width')

const textInput = document.getElementById('text-input')
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

const quantityBtns = document.querySelectorAll('.quantity-btn')
const quantityAmount = document.getElementById('quantity-amount')

/* -- quantity -- */
/*********************************************************************************** */
let selectedQuantity = 1

const quantityBtnHandler = (btn) => {
  if (btn.target.id === 'remove') {
    if (selectedQuantity <= 1) {
      return
    }

    selectedQuantity--
    return (quantityAmount.innerText = selectedQuantity)
  }

  selectedQuantity++
  return (quantityAmount.innerText = selectedQuantity)
}

/* -- start of buisness -- */
/*********************************************************************************** */
const boot = async () => {
  canvas.style.width = SIZE_BASE + 'px'
  canvas.style.height = SIZE_BASE + 'px'
  canvas.width = Math.floor(SIZE_BASE * DEVICE_PIXEL_RATIO)
  canvas.height = Math.floor(SIZE_BASE * DEVICE_PIXEL_RATIO)

  await initColorCategories();
  await initColors();
  await initFontCategories();
  await initFonts();

  colorSelect.addEventListener('click', handleColorSelectClicked)
  fontSelect.addEventListener('click', handleFontSelectClicked)

  for (const quantityBtn of quantityBtns) {
    quantityBtn.addEventListener('click', quantityBtnHandler)
  }

  const options = document.querySelectorAll('#options .control-options-item')
  for (const option of options) {
    option.addEventListener('click', (e) => selectOption(e.target.id));
  }

  const heightOptions = document.querySelectorAll('#height-options .control-options-item')
  for (const option of heightOptions) {
    option.addEventListener('click', (e) => selectHeightOption(e.target.id));
  }

  widthInput.addEventListener('keyup', handleWidthInputChanged);
  heightInput.addEventListener('keyup', handleHeightInputChanged);

  window.requestAnimationFrame(run);

  selectColor(colors[0].id);
  selectFont(fonts[0].id);
  selectHeightOption('body');
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

const run = () => {
  update();
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

const handleWidthInputChanged = () => {
  const wcm = width * PX_TO_CM;
  homotheticScale = widthInput.value / wcm;
}

const handleHeightInputChanged = () => {
  const hcm = height * PX_TO_CM;
  homotheticScale = heightInput.value / hcm;
}

const handleColorSelectClicked = () => {
  colorSelector.classList.toggle('selector-colors--visible')
  colorSelectArrow.classList.toggle('activated')
}

const handleFontSelectClicked = () => {
  fontSelector.classList.toggle('selector-fonts--visible')
  fontSelectArrow.classList.toggle('activated')
}

const update = () => {
  const text = textInput.value.trim();
  const metrics = ctx.measureText(text);

  const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
  const heightDeltaFactor = height / actualHeight;

  width = selectedHeightOption == 'body' ? metrics.width : metrics.width * heightDeltaFactor;
  height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent ?? fontSize

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width / DEVICE_PIXEL_RATIO + 'px';
  canvas.style.height = height / DEVICE_PIXEL_RATIO + 'px';

  const fontFamily = selectedFont ? selectedFont.attributes.label : 'Arial';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '160px ' + fontFamily;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  ctx.save();

  if (selectedHeightOption == 'body') {
    const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    const actualY = (height - actualHeight) / 2;

    ctx.beginPath();
    ctx.moveTo(0, actualY);
    ctx.lineTo(width, actualY);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, actualY + actualHeight);
    ctx.lineTo(width, actualY + actualHeight);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
  }

  if (selectedOptions.includes('inversed')) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }

  if (selectedOptions.includes('pochoir')) {
    ctx.fillStyle = '#fff';
  }
  else {
    ctx.fillStyle = selectedColor ? selectedColor.attributes.color : '#000';
  }

  if (selectedHeightOption == 'body') {
    const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    ctx.fillText(text, 0, metrics.actualBoundingBoxAscent + (height - actualHeight) / 2);
  }
  else {
    // const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

    console.log(heightDeltaFactor);

    ctx.scale(heightDeltaFactor, heightDeltaFactor);
    ctx.fillText(text, 0, metrics.actualBoundingBoxAscent - metrics.fontBoundingBoxAscent);
  }

  ctx.restore();

  const h = Number.parseFloat(height * homotheticScale * PX_TO_CM).toFixed(1);
  const w = Number.parseFloat(width * homotheticScale * PX_TO_CM).toFixed(1);
  metricsHeight.innerText = h + ' cm';
  metricsWidth.innerText = w + ' cm';

  if (document.activeElement != widthInput) {
    widthInput.value = Number.parseFloat(width * homotheticScale * PX_TO_CM).toFixed(1);
  }

  if (document.activeElement != heightInput) {
    heightInput.value = Number.parseFloat(height * homotheticScale * PX_TO_CM).toFixed(1);
  }
}

boot();