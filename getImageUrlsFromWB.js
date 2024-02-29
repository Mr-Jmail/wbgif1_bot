const { chromium } = require('playwright');

module.exports = async function getImageUrlsFromWB(url, numberOfRetries = 1) {
    const browser = await chromium.launch({ timeout: 10000 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try
    {
        await page.goto(url);

        await page.waitForFunction(() => document.querySelector('#app')?.children?.length > 2);
        
        if (await page.$(".content404")) throw "Несуществующий артикул"

        await page.waitForSelector('.j-zoom-image', { state: "attached" })

        await page.click('.zoom-image-container');
        await page.waitForLoadState("networkidle")

        const images = await page.$$('.j-zoom-image');
        const urls = [];

        for (const image of images) {
            const classAttribute = await image.getAttribute("class");
            if (!classAttribute.includes("photo-zoom__preview")) urls.push(await image.getAttribute("src"));
        }

        return urls
    }
    catch (error)
    {
        if (error == "Несуществующий артикул") return "Несуществующий артикул"
        console.log(error)
        console.log("retring")
        if (numberOfRetries >= 3) return "Произошла ошибка. Попробуйте другую ссылку"
        await browser.close()
        return await getImageUrlsFromWB(url, ++numberOfRetries)
    }
    finally
    {
        await browser.close()
    }
    
}