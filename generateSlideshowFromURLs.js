const axios = require('axios');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');

module.exports = async function generateSlideshowFromURLs(imageURLs, outputFilePath) {
    const frameDir = 'frames';

    if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);

    // Скачиваем каждое изображение и сохраняем его как кадр видео
    for (let i = 0; i < imageURLs.length; i++)
    {
        const response = await axios.get(imageURLs[i], { responseType: 'arraybuffer' });
        const outputPath = `${frameDir}/frame${i + 1}.jpg`;
        fs.writeFileSync(outputPath, Buffer.from(response.data, 'binary'));
    }

    // Создаем видео из кадров с помощью ffmpeg
    const ffmpegProcess = spawn(ffmpeg, [
        '-y',
        '-framerate', '0.75', // Частота кадров в видео (1 кадр в секунду)
        '-i', `${frameDir}/frame%d.jpg`, // Путь к файлам кадров
        '-c:v', 'libx264', // Кодек для видео
        '-pix_fmt', 'yuv420p', // Формат пикселей
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Обязательное масштабирование для сохранения четного размера
        outputFilePath
    ]);

    return new Promise((resolve, reject) => {
        ffmpegProcess.on('close', (code) => {

            if (code === 0) resolve(outputFilePath);
            else reject(new Error(`ffmpeg exited with code ${code}`));

            fs.readdirSync(frameDir).forEach(file => fs.unlinkSync(`${frameDir}/${file}`));
            fs.rmdirSync(frameDir);
        });

        ffmpegProcess.on('error', (err) => reject(err));
    });
}
