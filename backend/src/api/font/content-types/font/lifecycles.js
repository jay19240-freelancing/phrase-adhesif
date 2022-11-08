let PImage = require('pureimage');
let fs = require('fs');

module.exports = {
  afterCreate(event) {
    const { result } = event;
    const fnt = PImage.registerFont('./public' + result.file.url, result.label);
    fnt.load(() => {
      const width = 400;
      const height = 200;
      const fontSize = 34;
      const centerX = width * 0.5;
      const img1 = PImage.make(width, height);
      const ctx = img1.getContext('2d');
  
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
  
      ctx.font = fontSize + 'px ' + result.label;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      const metrics = ctx.measureText('abcde');
      const halfFontHeight = (metrics.emHeightAscent + metrics.emHeightDescent) * 0.5;
      const step = height / 4;

      const line1 = result.label;
      ctx.fillText(line1, centerX, step + halfFontHeight);

      const line2 = 'abcdef/ABCDEF';
      ctx.fillText(line2, centerX, (step * 2) + halfFontHeight);

      const line3 = '0123456789';
      ctx.fillText(line3, centerX, (step * 3) + halfFontHeight);
  
      PImage.encodePNGToStream(img1, fs.createWriteStream('./public/font-previews/' + result.file.hash + '.png')).then(() => {
        console.log("wrote out the png file to out.png");
      }).catch((e) => {
        console.log("there was an error writing");
      });
    });
  },
};