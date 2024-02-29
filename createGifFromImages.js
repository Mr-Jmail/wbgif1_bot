const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gifencoder');
const sizeOf = require('image-size');
const sharp = require('sharp');
const fs = require('fs')

const convertToPNG = async (buffer) => sharp(buffer).png().toBuffer();

module.exports = async function createGifFromImages(imageURLs = [""], outputPath = "./output.gif")
{
    var maxWidth = 0;
    var maxHeight = 0;

    for (const imageURL of imageURLs)
    {
        const response = await axios.get(imageURL, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const dimensions = sizeOf(buffer);
        maxWidth = Math.max(maxWidth, dimensions.width);
        maxHeight = Math.max(maxHeight, dimensions.height);
    }

    const encoder = new GIFEncoder(maxWidth, maxHeight);
    encoder.createReadStream().pipe(fs.createWriteStream(outputPath));

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(1666);
    encoder.setQuality(10);

    const canvas = createCanvas(maxWidth, maxHeight);
    const ctx = canvas.getContext('2d');

    for (const imageURL of imageURLs)
    {
        const response = await axios.get(imageURL, { responseType: 'arraybuffer' });
        const buffer = await convertToPNG(Buffer.from(response.data));
        const image = await loadImage(buffer);
        ctx.clearRect(0, 0, maxWidth, maxHeight);

        const offsetX = (maxWidth - image.width) / 2;
        const offsetY = (maxHeight - image.height) / 2;

        ctx.drawImage(image, offsetX, offsetY);

        encoder.addFrame(ctx);
    }

    encoder.finish();
    return outputPath
}
