import * as DiscordJS from "discord.js"
import { Client } from "discord.js"
import { debug_messageCreate } from "./debug"
import { easter_egg_messageCreate } from "./easter_egg"
import { processICS } from "./zTopic_calendar_management"
import { dataFetch } from "./utility"
import { ICS_CHANNEL_LISTENER, SILLY_VIDEO_CHANNEL_LISTENER } from "./index"

const urlReplacements: { [key: string]: string } = {
    'vm.tiktok.com': 'd.tnktok.com',
    'tiktok.com': 'd.tnktok.com',
    'twitter.com': 'd.fxtwitter.com',
    'x.com': 'd.fxtwitter.com',
    'bsky.app': 'r.bskx.app',
}

export async function messageCreate(client: Client, message: DiscordJS.Message) {
    if (client.user == null) {
        console.error(`client.user is null (jx0033)`)
        return
    }

    if (message.author.id === client.user.id) {
        return
    }

    // check for attachment
    if (message.channel.id === ICS_CHANNEL_LISTENER && message.attachments.size > 0) {
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

    // Check if message was posted in the SILLY_VIDEO_CHANNEL_LISTENER channel
    if (message.channel.id === SILLY_VIDEO_CHANNEL_LISTENER) {
        let modifiedContent = message.content
        let contentModified = false

        // Iterate over the dictionary and replace URLs
        for (const [findUrl, replaceUrl] of Object.entries(urlReplacements)) {
            const urlPattern = new RegExp(findUrl)
            if (urlPattern.test(modifiedContent)) {
                modifiedContent = modifiedContent.replace(urlPattern, replaceUrl)
                contentModified = true
                break
            }
        }

        // Send the modified content if any replacements were made
        if (contentModified && message.channel instanceof DiscordJS.TextChannel) {
            const username = message.member?.nickname || message.author.username
            const modifiedMessage = `${username}: ${modifiedContent}`
            await message.channel.send(modifiedMessage)
            await message.delete()
            return
        }
    }

    await debug_messageCreate(message)
    await easter_egg_messageCreate(message)
}