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

export async function interactionCreateCommand(client: Client, i: Interaction) {
    if (!i.isCommand()) return

    const { commandName, options, user, member, guild } = i

    if (commandName === "today") {
        getTodayCalendarEvents().then((events) => {
            const formattedDates = formatCalendarEvents(events, true)

            const embeds = stringToEmbeds("Today's events", formattedDates)

            i.reply({ embeds: embeds })
        })
        return
    }

    if (commandName === "tomorrow") {
        getTomorrowCalendarEvents().then((events) => {
            const formattedDates = formatCalendarEvents(events, true)

            const embeds = stringToEmbeds("Tomorrows events", formattedDates)

            i.reply({ embeds: embeds })
        })
        return
    }

    if (commandName === "thisweek") {
        getThisWeekCalendarEvents().then((events) => {
            const formattedDates = formatCalendarEvents(events, false)

            const embeds = stringToEmbeds("This weeks events", formattedDates)

            i.reply({ embeds: embeds })
        })
        return
    }

    if (commandName === "nextweek") {
        getNextWeekCalendarEvents().then((events) => {
            const formattedDates = formatCalendarEvents(events, false)

            const embeds = stringToEmbeds("Events for the next 7 days", formattedDates)

            i.reply({ embeds: embeds })
        })
        return
    }

    if (commandName === "weekend") {
        getWeekendCalendarEvents().then((events) => {
            const formattedDates = formatCalendarEvents(events, false)

            const embeds = stringToEmbeds("Weekend events", formattedDates)

            i.reply({ embeds: embeds })
        })
        return
    }
}