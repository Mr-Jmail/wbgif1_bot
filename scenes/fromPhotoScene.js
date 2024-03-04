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

    await ctx.telegram.sendDocument(ctx.from.id, { source: gifPath }, { disable_content_type_detection: true })

    await ctx.telegram.deleteMessage(ctx.from.id, messageId).catch(err => console.log(err))

    ctx.scene.leave()
})

module.exports = fromPhotoScene