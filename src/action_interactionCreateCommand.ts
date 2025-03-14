import {
    Client, Interaction
} from "discord.js"
import {
    formatCalendarEvents,
    getNextWeekCalendarEvents,
    getThisWeekCalendarEvents,
    getTodayCalendarEvents, getTomorrowCalendarEvents, getWeekendCalendarEvents
} from "./zTopic_calendar_management"
import { stringToEmbeds } from "./utility"
import { getIcsUpdateTime } from "./scheduled_jobs"

export async function interactionCreateCommand(client: Client, i: Interaction) {
    if (!i.isCommand()) return

    const { commandName, options, user, member, guild } = i

    if (commandName === "today") {
        getTodayCalendarEvents().then(async (events) => {
            const formattedDates = formatCalendarEvents(events, true)

            const embeds = stringToEmbeds("Today's events", formattedDates, "#d9264d", await getIcsUpdateTime())

            i.reply({embeds: embeds})
        })
        return
    }

    if (commandName === "tomorrow") {
        getTomorrowCalendarEvents().then(async (events) => {
            const formattedDates = formatCalendarEvents(events, true)

            const embeds = stringToEmbeds("Tomorrows events", formattedDates, "#d9264d", await getIcsUpdateTime())

            i.reply({embeds: embeds})
        })
        return
    }

    if (commandName === "thisweek") {
        getThisWeekCalendarEvents().then(async (events) => {
            const formattedDates = formatCalendarEvents(events, false)

            const embeds = stringToEmbeds("This weeks events", formattedDates, "#d9264d", await getIcsUpdateTime())

            i.reply({embeds: embeds})
        })
        return
    }

    if (commandName === "nextweek") {
        getNextWeekCalendarEvents().then(async (events) => {
            const formattedDates = formatCalendarEvents(events, false)

            const embeds = stringToEmbeds("Events for the next 7 days", formattedDates, "#d9264d", await getIcsUpdateTime())

            i.reply({embeds: embeds})
        })
        return
    }

    if (commandName === "weekend") {
        getWeekendCalendarEvents().then(async (events) => {
            const formattedDates = formatCalendarEvents(events, false)

            const embeds = stringToEmbeds("Weekend events", formattedDates, "#d9264d", await getIcsUpdateTime())

            i.reply({embeds: embeds})
        })
        return
    }
}