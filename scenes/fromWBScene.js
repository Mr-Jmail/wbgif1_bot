const { Scenes } = require("telegraf")
const fs = require('fs');
const getImageUrlsFromWB = require("../getImageUrlsFromWB")
const generateSlideshowFromURLs = require("../generateSlideshowFromURLs")

const fromWBScene = new Scenes.BaseScene("fromWBScene")

fromWBScene.enter(ctx => ctx.reply("Пришли ссылку/артикул для генерации GIF с карточки товара Wildberries"))

fromWBScene.command("cancel", ctx => {
    ctx.reply("Создание gif отменено")
    ctx.scene.leave()
})

fromWBScene.on("text", async ctx => {
    const messageId = (await ctx.reply("Проверяю ссылку")).message_id
    const url = normalizeWildberriesLink(ctx.message.text)
    if (!url) return ctx.reply("Отправь либо ссылку (пример: https://www.wildberries.ru/catalog/1111111111/), либо артикул (пример: 1111111111)")
    console.log(url)
    await ctx.telegram.editMessageText(ctx.from.id, messageId, undefined, "Скачиваю фотографии..")

    var imageUrls = await getImageUrlsFromWB(url)
    if (typeof imageUrls == "string") return ctx.reply(imageUrls)

    await ctx.telegram.editMessageText(ctx.from.id, messageId, undefined, "Генерирую gif из полученных фотографий")

    const gifPath = `${ctx.from.id}.mp4`
    await generateSlideshowFromURLs(imageUrls, gifPath)

    await ctx.telegram.editMessageText(ctx.from.id, messageId, undefined, "Загружаю gif в телеграм")

    await ctx.telegram.sendAnimation(ctx.from.id, { source: gifPath })

    fs.rmSync(gifPath)

    await ctx.telegram.deleteMessage(ctx.from.id, messageId).catch(err => console.log(err))
    ctx.scene.leave()
})

function normalizeWildberriesLink(input) {
    if (input.startsWith("https://www.wildberries.ru/catalog")) {
        if (input.endsWith("/detail.aspx")) return input;
        return input + (input.endsWith("/") ? "detail.aspx" : "/detail.aspx");
    }

    if (/^\d+$/.test(input)) return `https://www.wildberries.ru/catalog/${input}/detail.aspx`;

    if (/^\d+\/?$/.test(input)) return `https://www.wildberries.ru/catalog/${input}/detail.aspx`;
}

module.exports = fromWBScene