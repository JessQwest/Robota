import {
    Client, Interaction
} from "discord.js"
import { formatCalendarEvents, getThisWeekCalendarEvents, getTodayCalendarEvents } from "./zTopic_calendar_management"
import { stringToEmbeds } from "./utility"

export async function interactionCreateCommand(client: Client, i: Interaction) {
    if (!i.isCommand()) return

    const { commandName, options, user, member, guild } = i

    if (commandName === "today") {
        getTodayCalendarEvents().then((events) => {
            const formattedDates = formatCalendarEvents(events)

            const embeds = stringToEmbeds("Today's events", formattedDates)

            i.reply({ embeds: embeds })
        })
        return
    }

    if (commandName === "thisweek") {
        getThisWeekCalendarEvents().then((events) => {
            const formattedDates = formatCalendarEvents(events)

            const embeds = stringToEmbeds("This weeks events", formattedDates)

            i.reply({ embeds: embeds })
        })
        return
    }
}