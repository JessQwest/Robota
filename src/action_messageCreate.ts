import * as DiscordJS from "discord.js"
import { Attachment, Client } from "discord.js"
import { debug_messageCreate } from "./debug"
import { easter_egg_messageCreate } from "./easter_egg"


export async function messageCreate(client: Client, message: DiscordJS.Message) {
    if (client.user == null) {
        console.error(`client.user is null (jx0033)`)
        return
    }

    // check for attachment
    if (message.attachments.size > 0) {
        console.log(`Attachment found`)
        console.log(message.attachments)
        const attachment = message.attachments.first()
    }

    await debug_messageCreate(message)
    await easter_egg_messageCreate(message)
}

function processICS(attachment: Attachment) {
    console.log(`Processing attachment ${attachment.toJSON()}`)
    console.log(attachment)
}