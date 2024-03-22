const axios = require('axios');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

module.exports = async function generateSlideshowFromURLs(imageURLs, outputFilePath) {
    const frameDir = 'frames';

    if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);

    // Download each image and save it as a video frame
    for (let i = 0; i < imageURLs.length; i++)
    {
        const response = await axios.get(imageURLs[i], { responseType: 'arraybuffer' });
        const outputPath = `${frameDir}/frame${i + 1}.jpg`;
        fs.writeFileSync(outputPath, Buffer.from(response.data, 'binary'));
    }
    return await new Promise(resolve => {
        ffmpeg()
            .input('frames/frame%d.jpg') // Обратите внимание на %d вместо *
            .inputOptions('-framerate 0.5')
            .videoCodec('libx264')
            .outputOptions('-r 30')
            .outputOptions('-pix_fmt yuv420p')
            .output(outputFilePath)
            .on('end', () => {
                fs.readdirSync(frameDir).forEach(file => fs.unlinkSync(`${frameDir}/${file}`));
                fs.rmdirSync(frameDir);
                console.log('Кодирование завершено')
                return resolve()
            })
            .on('error', (err) => console.error('Ошибка при кодировании:', err))
            .run();
    })
    
}

