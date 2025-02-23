import {
    formatCalendarEvents,
    getThisWeekCalendarEvents,
    getTodayCalendarEvents,
    getWeekendCalendarEvents, processICS
} from "./zTopic_calendar_management"
import { stringToEmbeds } from "./utility"
import { client, SCHEDULE_BROADCAST_CHANNEL, WEBDAV_ENABLED, WEBDAV_FILEPATH, webdavClient } from "./index"
import axios from 'axios';
import { readData, writeData } from "./data_persistence"

export async function hourlyHousekeepTask() {
    if (client.user != null) {
        const targetDate = new Date(Date.UTC(new Date().getFullYear(), 7, 12, 10, 0, 0))
        const currentDate = new Date()
        const timeDifference = targetDate.getTime() - currentDate.getTime()
        const daysUntilTarget = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
        console.log(`changing target date: ${daysUntilTarget} days.`)
        client.user.setActivity(`${daysUntilTarget} days.`)
    }
}

export async function pullWebdav() {
    if (webdavClient === null || WEBDAV_ENABLED === false) return
    console.log("Pulling Webdav")
    const rootExists = await webdavClient.exists('/')
    if (!rootExists) {
        console.log("Root does not exist")
        return
    }

    const stats = await webdavClient.stat(WEBDAV_FILEPATH)
    if ('lastmod' in stats) {
        console.log(`Last modified: ${stats.lastmod}`)
    } else return

    const lastModified = await readData('ics_last_modified')
    if (lastModified === stats.lastmod) {
        console.log("No new ICS file found")
        return
    } else {
        console.log(`New ICS file found! New ICS: ${stats.lastmod}. Old ICS: ${lastModified}`)
    }

    const contents = await webdavClient.getFileContents(WEBDAV_FILEPATH, {format: 'text'})

    if (typeof contents !== 'string') {
        console.log("Obtained file is not a string!")
        return
    }

    await processICS(contents).then(() => {
        console.log("ICS file processed successfully")
        writeData('ics_last_modified', stats.lastmod)
    }).catch((error) => {
        console.error(`Failed to process ICS file: ${error}`)
    })
}

export async function mondayAnnouncementTask() {
    getThisWeekCalendarEvents().then(async (events) => {
        const formattedDates = formatCalendarEvents(events, false)

        const embeds = stringToEmbeds("This week's events", formattedDates)

        let preamble = await generatePreamble(new Date(), 'WEEK')

        await client.channels.fetch(SCHEDULE_BROADCAST_CHANNEL).then((channel: any) => {
            channel.send({content: preamble, embeds: embeds})
        })
    })
}

export async function weekendAnnouncementTask() {
    getWeekendCalendarEvents().then(async (events) => {
        const formattedDates = formatCalendarEvents(events, false)

        const embeds = stringToEmbeds("This weekends events", formattedDates)

        let preamble = await generatePreamble(new Date(), 'WEEKEND')

        await client.channels.fetch(SCHEDULE_BROADCAST_CHANNEL).then((channel: any) => {
            channel.send({content: preamble, embeds: embeds})
        })
    })
}

export async function dailyAnnouncementTask() {
    getTodayCalendarEvents().then(async (events) => {
        const formattedDates = formatCalendarEvents(events, true)

        const embeds = stringToEmbeds("Today's events", formattedDates)

        let preamble = await generatePreamble(new Date(), 'TODAY')

        console.log(`preamble = ${preamble}`)

        await client.channels.fetch(SCHEDULE_BROADCAST_CHANNEL).then((channel: any) => {
            channel.send({content: preamble, embeds: embeds})
        })
    })
}

type ScheduleType = 'TODAY' | 'WEEK' | 'WEEKEND';

const FUN_FACT = "Today's fun fact:"

const DAY_TEXTS: { [key: number]: string } = {
    0: "Happy Sunday! Make sure you visit the shops before 4pm!",
    1: "Happy Monday! It's the start of the week and no longer the weekend :(",
    2: "Happy Tuesday! It's statistically the best day to buy tacos and pizza!",
    3: "Happy Wednesday! We're halfway through the week!",
    4: "Happy Thursday! The weekend is almost here!",
    5: "Happy Friday! [MUFASA MOMENT!!](https://media1.tenor.com/m/F24VAo_wF4AAAAAC/its-friday-there.gif)",
    6: "Happy Saturday! It's the weekend! Time for lots of snuggles and relaxing"
};

const SCHEDULE_TEXTS = {
    'TODAY': "Let's see what Jess is doing today:",
    'WEEK': "Here's what Jess is up to this week:",
    'WEEKEND': "Here's what Jess is up to this weekend:"
};

async function generatePreamble(date: Date, scheduleType: ScheduleType): Promise<string> {
    const dayOfWeek = date.getDay();
    const dayText = DAY_TEXTS[dayOfWeek];
    const scheduleText = SCHEDULE_TEXTS[scheduleType];

    const funFactResponse = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/today');
    const funFact = `${FUN_FACT} ${funFactResponse.data.text}`;

    return `${dayText}\n\n${funFact}\n\n${scheduleText}`;
}