import * as DiscordJS from "discord.js"
import { Client } from "discord.js"
import { debug_messageCreate } from "./debug"
import { easter_egg_messageCreate } from "./easter_egg"
import { processICS } from "./zTopic_calendar_management"
import { dataFetch } from "./utility"


export async function messageCreate(client: Client, message: DiscordJS.Message) {
    if (client.user == null) {
        console.error(`client.user is null (jx0033)`)
        return
    }

    // check for attachment
    if (message.attachments.size > 0) {
        console.log(`Attachment found`)
        const attachment = message.attachments.first()
        if (attachment && attachment.size > 1000000) {
            await message.reply(`Attachment too large to process!`)
            return
        }
        const data_url = attachment?.url
        if (data_url == null) return
        const fileContent = await dataFetch(data_url)
        await processICS(fileContent)
        return
    }

    await debug_messageCreate(message)
    await easter_egg_messageCreate(message)
}