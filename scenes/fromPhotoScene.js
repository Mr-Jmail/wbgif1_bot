const { Scenes } = require("telegraf")
const getImageUrlsFromWB = require("../getImageUrlsFromWB")
const createGifFromImages = require("../createGifFromImages")

const fromPhotoScene = new Scenes.BaseScene("fromPhotoScene")

fromPhotoScene.enter(ctx => {
    ctx.scene.session.state.photoes = []
    ctx.reply("Пришли фотографии для генерации GIF. После того как отправишь все нужные фото, нажми на кнопку ниже", { reply_markup: { inline_keyboard: [[{ text: "Сгенерировать gif", callback_data: "generateGif" }]]}})
})

fromPhotoScene.on("photo", async ctx => ctx.scene.session.state.photoes.push(await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id)))


fromPhotoScene.action("generateGif", async ctx => {
    const { photoes } = ctx.scene.session.state
    if (photoes.length < 2) return await ctx.reply("Для создания gif, отправь хотя бы 2 фотографии")
    const messageId = (await ctx.reply("Скачиваю фотографии..")).message_id
    
    setTimeout(() => ctx.telegram.editMessageText(ctx.from.id, messageId, undefined, "Генерирую gif из полученных фотографий"), 1200)
    
    const gifPath = `${ctx.from.id}.gif`
    await createGifFromImages(photoes, gifPath)

    await ctx.telegram.editMessageText(ctx.from.id, messageId, undefined, "Загружаю gif в телеграм")

    await ctx.telegram.sendAnimation(ctx.from.id, { source: gifPath }, { height: 1200, width: 900 })

    await ctx.telegram.deleteMessage(ctx.from.id, messageId).catch(err => console.log(err))
})

fromPhotoScene.on("text", async ctx => {
    const messageId = (await ctx.reply("Проверяю ссылку")).message_id
    const url = normalizeWildberriesLink(ctx.message.text)
    if (!url) return ctx.reply("Отправь либо ссылку (пример: https://www.wildberries.ru/catalog/1111111111/), либо артикул (пример: 1111111111)")

    await ctx.telegram.editMessageText(ctx.from.id, messageId, undefined, "Скачиваю фотографии..")

    var imageUrls = await getImageUrlsFromWB(url)
    if (typeof imageUrls == "string") return ctx.reply(imageUrls)

    await ctx.telegram.editMessageText(ctx.from.id, messageId, undefined, "Генерирую gif из полученных фотографий")

    const gifPath = `${ctx.from.id}.gif`
    await createGifFromImages(imageUrls, gifPath)

    await ctx.telegram.editMessageText(ctx.from.id, messageId, undefined, "Загружаю gif в телеграм")

    await ctx.telegram.sendAnimation(ctx.from.id, { source: gifPath }, { height: 1200, width: 900 })

    await ctx.telegram.deleteMessage(ctx.from.id, messageId).catch(err => console.log(err))
})

function normalizeWildberriesLink(input) {
    if (input.startsWith("https://www.wildberries.ru/catalog")) {
        if (input.endsWith("/detail.aspx")) return input;
        return input + (input.endsWith("/") ? "detail.aspx" : "/detail.aspx");
    }

    if (/^\d+$/.test(input)) return `https://www.wildberries.ru/catalog/${input}/detail.aspx`;

    if (/^\d+\/?$/.test(input)) return `https://www.wildberries.ru/catalog/${input}/detail.aspx`;
}

module.exports = fromPhotoScene