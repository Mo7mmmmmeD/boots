const inquirer = require("inquirer");
const chalkAnimation = require("chalk-animation");
const startBot = require("./util/bot.js")
const Database = require("st.db");
const config = new Database({ path: "./config.json", databaseInObject: true })
getStarted()
function clearTextPrompt(str, status_bot = false) {
    return !status_bot ? str.replaceAll("\\", "").replaceAll(" ", "").replaceAll("~", "") : str.replaceAll("\\", "").replaceAll("~", "")
}

async function getStarted() {
    if (await config.get("do_false_this_value_if_you_want_delete_token") != true) {
        await config.delete(`token`)
    }
    if (await config.has(`token`) == true) return await startBot()
    const rainbow = chalkAnimation.neon('ًﺍﺮﻴﺜﻛ ﺭﺎﻔﻐﺘﺳﻻﺍﻭ ﻪﻠﻟﺍ ﺮﻛﺫ ﻰﺴﻨﺗ ﻻ ﺀﻲﺷ ﻞﻛ ﻞﺒﻗ');
    setTimeout(async () => {
        rainbow.stop()
        console.log(`\u001b[38;5;208;1mMusic\u001b[0m Bot By \u001b[38;5;202;1mShuruhatik#2443\u001b[0m `)
        const ask1 = await inquirer.prompt({
            name: "token_bot",
            type: 'password',
            message: `Put your Bot token :`,
            mask: "*"
        })
        const ask2 = await inquirer.prompt({
            name: "status_bot",
            type: 'input',
            message: `Type in the status of the bot you want :`,
        })
        const ask3 = await inquirer.prompt({
            name: "status_type",
            type: 'list',
            message: `Choose the type of bot status :`,
            choices: [
                { name: "PLAYING", value: 0 }, { name: "LISTENING", value: 2 }, { name: "WATCHING", value: 3 }, { name: "COMPETING", value: 5 }
            ]
        })
        await config.set(`token`, clearTextPrompt(ask1.token_bot))
        await config.set("status_type", ask3.status_type)
        await config.set("status_bot", clearTextPrompt(ask2.status_bot, true))
        await config.set("do_false_this_value_if_you_want_delete_token", true)
        return await startBot()
    }, 3460)
}
