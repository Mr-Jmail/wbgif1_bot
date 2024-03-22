const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const ffmpeg = require('fluent-ffmpeg');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

const writeFileAsync = promisify(fs.writeFile);
const rimrafAsync = promisify(rimraf);
const mkdirpAsync = promisify(mkdirp);

module.exports = async function generateSlideshowFromURLs(imageURLs, outputFilePath) {
    const frameDir = 'frames';

    await mkdirpAsync(frameDir);

    try {
        // Скачиваем каждое изображение и сохраняем его как кадр видео
        await Promise.all(imageURLs.map(async (url, index) => {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const outputPath = `${frameDir}/frame${index + 1}.jpg`;
            await writeFileAsync(outputPath, Buffer.from(response.data, 'binary'));
        }));

        // Создаем видео из кадров с помощью fluent-ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(`${frameDir}/frame%d.jpg`)
                .inputOptions(['-framerate 0.75']) // Частота кадров в видео (1 кадр в секунду)
                .videoCodec('libx264') // Кодек для видео
                .outputOptions(['-pix_fmt yuv420p', '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2']) // Обязательное масштабирование для сохранения четного размера
                .on('end', () => {
                    resolve();
                })
                .on('error', (err) => {
                    reject(err);
                })
                .save(outputFilePath);
        });

        // Удаляем временные файлы
        await rimrafAsync(frameDir);

        return outputFilePath;
    } catch (error) {
        // Удаляем временные файлы в случае ошибки
        await rimrafAsync(frameDir);
        throw error;
    }
};
