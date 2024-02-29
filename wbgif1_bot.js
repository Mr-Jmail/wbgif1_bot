const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { Telegraf, Scenes, session, Input } = require("telegraf")
const bot = new Telegraf(process.env.botToken)

const fromWBScene = require("./scenes/fromWBScene");
const fromPhotoScene = require("./scenes/fromPhotoScene");

const stage = new Scenes.Stage([fromPhotoScene, fromWBScene])

bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => ctx.reply("Привет, я помогу тебе создать gif. У меня есть два режима, выбери тот, который тебе нужен", { reply_markup: { inline_keyboard: [[{ text: "Создать gif из фотографий", callback_data: "fromPhoto" }], [{ text: "Создать gif из карточки товара WB", callback_data: "fromWB" }]]}}))

bot.action("fromPhoto", ctx => ctx.scene.enter("fromPhotoScene"))

bot.action("fromWB", ctx => ctx.scene.enter("fromWBScene"))

// Функция для отправки GIF
bot.launch()