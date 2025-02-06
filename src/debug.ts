import * as DiscordJS from "discord.js"
import { ADMIN_USER_ID, DEBUG_CHANNEL_ID } from "./index"
import { dailyAnnouncementTask, mondayAnnouncementTask, weekendAnnouncementTask } from "./scheduled_jobs"

export async function debug_messageCreate(message: DiscordJS.Message) {
    console.log("debug_messageCreate")
    if (message.content === "dct" && message.author.id === ADMIN_USER_ID && message.channelId === DEBUG_CHANNEL_ID) {
        await dailyAnnouncementTask()
        return
    }

    if (message.content === "mct" && message.author.id === ADMIN_USER_ID && message.channelId === DEBUG_CHANNEL_ID) {
        await mondayAnnouncementTask()
        return
    }

    if (message.content === "wct" && message.author.id === ADMIN_USER_ID && message.channelId === DEBUG_CHANNEL_ID) {
        await weekendAnnouncementTask()
        return
    }
}