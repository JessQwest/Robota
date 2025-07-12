import ical, { CalendarResponse, PropertyWithArgs, VEvent } from "node-ical"
import moment from "moment-timezone"
import {
    con,
    EMOJI_FRIDAY,
    EMOJI_MONDAY,
    EMOJI_SATURDAY,
    EMOJI_SUNDAY,
    EMOJI_THURSDAY,
    EMOJI_TUESDAY,
    EMOJI_WEDNESDAY
} from "./index"
import { dateToDiscordTimestamp } from "./utility"

interface VEventMS extends VEvent {
    categories?: string[];
}

interface CalendarEvent {
    name: string;
    startTime: Date;
    endTime: Date;
    categories?: string[];
}


export async function processICS(icsString: string) {
    const calendar: CalendarResponse = ical.sync.parseICS(icsString);
    const events: CalendarEvent[] = [];

    for (const key in calendar) {
        if (calendar.hasOwnProperty(key)) {
            const event = calendar[key];
            if (event.type === 'VEVENT') {
                const vEvent = event as VEventMS;
                const summaryObj = vEvent.summary as unknown as PropertyWithArgs<any>;
                const summary = summaryObj.val;
                const startTime = vEvent.start;
                const endTime = vEvent.end;
                const duration = moment.duration(moment(endTime).diff(moment(startTime)));
                console.log(`Event ${summary} has a duration of ${duration.humanize()}`);
                const categories = vEvent.categories;

                if (categories && categories.some(category => category.toLowerCase().includes("ignore"))) {
                    continue;
                }

                // Looking into how we can better fix the occurence issue
                //console.log(`Event ${summary} has occurences ${JSON.stringify(event.recurrences)}`)

                if (vEvent.rrule) { // multi instance
                    const reoccurringEvents = vEvent.rrule.all();
                    //const exdate = vEvent.exdate;
                    //const recurrenceid = vEvent.recurrenceid;
                    //console.log(`Reoccurring event ${summary} has ${JSON.stringify(exdate)} & ${JSON.stringify(recurrenceid)}`)
                    for (const reoccurringEvent of reoccurringEvents) {
                        const reoccurringStartTime = reoccurringEvent;
                        const reoccurringEndTime = new Date(reoccurringStartTime.getTime() + duration.asMilliseconds());
                        const calendarEvent: CalendarEvent = {
                            name: summary,
                            startTime: reoccurringStartTime,
                            endTime: reoccurringEndTime,
                            categories: categories
                        };
                        //console.log(`Reoccurring event ${summary} at ${reoccurringStartTime}`);
                        events.push(calendarEvent);
                    }
                } else { // single instance
                    const calendarEvent: CalendarEvent = {
                        name: summary,
                        startTime: startTime,
                        endTime: endTime,
                        categories: categories
                    };

                    events.push(calendarEvent);
                }
            }
        }
    }
    await persistEventsToDatabase(events);
}

async function persistEventsToDatabase(events: CalendarEvent[]) {
    if (events.length > 0) {
        try {
            await new Promise<void>((resolve, reject) => {
                con.query('DELETE FROM `events`', function (err: any, result: any, fields: any) {
                    if (err) return reject(err);
                    console.log("All current records deleted from events table");
                    resolve();
                });
            });

            for (const event of events) {
                await new Promise<void>((resolve, reject) => {
                    con.query('INSERT INTO `events` (`name`, `startTime`, `endTime`, `categories`) VALUES (?, ?, ?, ?)',
                        [event.name, event.startTime, event.endTime, event.categories?.join(', ')],
                        function (err: any, result: any, fields: any) {
                            if (err) return reject(err);
                            console.log("Event inserted into database");
                            resolve();
                        });
                });
            }
        } catch (err) {
            console.error("Error persisting events to database:", err);
        }
    }
}

export async function getThisWeekCalendarEvents(): Promise<CalendarEvent[]> {
    const startTime = new Date();
    const day = startTime.getDay();
    const diff = startTime.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startTime.setDate(diff);
    startTime.setHours(0, 0, 1, 0);

    const endTime = new Date(startTime);
    endTime.setDate(startTime.getDate() + 6);
    endTime.setHours(23, 59, 59, 999);

    return await getOverlappingEvents(startTime, endTime);
}

export async function getNextWeekCalendarEvents(): Promise<CalendarEvent[]> {
    const startTime = new Date();
    startTime.setHours(0, 0, 1, 0);

    const endTime = new Date(startTime);
    endTime.setDate(startTime.getDate() + 6);
    endTime.setHours(23, 59, 59, 999);

    return await getOverlappingEvents(startTime, endTime);
}

export async function getTodayCalendarEvents(): Promise<CalendarEvent[]> {
    const startTime = new Date();
    startTime.setHours(0, 0, 1, 0);

    const endTime = new Date();
    endTime.setHours(23, 59, 59, 999);

    return await getOverlappingEvents(startTime, endTime);
}

export async function getTomorrowCalendarEvents(): Promise<CalendarEvent[]> {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(0, 0, 1, 0);

    const endTime = new Date(startTime);
    endTime.setHours(23, 59, 59, 999);

    return await getOverlappingEvents(startTime, endTime);
}

export async function getWeekendCalendarEvents(): Promise<CalendarEvent[]> {
    const startTime = new Date();
    const dayOfWeek = startTime.getDay();
    const daysUntilFriday = 5 - dayOfWeek;
    startTime.setDate(startTime.getDate() + daysUntilFriday);
    startTime.setHours(0, 0, 1, 0);

    const endTime = new Date(startTime);
    endTime.setDate(startTime.getDate() + 2);
    endTime.setHours(23, 59, 59, 999);

    return await getOverlappingEvents(startTime, endTime);
}

export function formatCalendarEvents(events: CalendarEvent[], dayView: boolean): string {
    let newDay = false;
    let lastEventDate: Date | null = null;

    if (events === null || events.length === 0) {
        return "No events found :smiling_face_with_3_hearts:";
    } else return events.map(event => {
        const startTime = event.startTime;
        newDay = !!(lastEventDate && startTime.toDateString() !== lastEventDate.toDateString());
        lastEventDate = startTime;
        const endTime = event.endTime;
        const dayEmoji = dayView ? "" : getDayEmoji(startTime);

        if (startTime.getHours() === 0 && startTime.getMinutes() === 0 && startTime.getSeconds() === 0 &&
            endTime.getHours() === 0 && endTime.getMinutes() === 0 && endTime.getSeconds() === 0 &&
            endTime.getTime() - startTime.getTime() === 24 * 60 * 60 * 1000) {
            const adjustedStartTime = new Date(startTime.getTime() + 12 * 60 * 60 * 1000);
            return `${newDay ? "\n" : ""}${dayEmoji}${dateToDiscordTimestamp(adjustedStartTime, "D")}: ${event.name}`;
        } else {
            const formattedStartTime = dateToDiscordTimestamp(startTime, dayView ? "t" : "f", "start");
            const formattedEndTime = dateToDiscordTimestamp(endTime, "t", "end");
            return `${newDay ? "\n" : ""}${dayEmoji}${formattedStartTime} - ${formattedEndTime}: ${event.name}`;
        }
    }).join('\n');
}

async function getOverlappingEvents(startTimeInput: Date, endTimeInput: Date): Promise<CalendarEvent[]> {
    return new Promise((resolve, reject) => {
        const startTime = startTimeInput.toISOString().slice(0, 19).replace('T', ' ');
        const endTime = endTimeInput.toISOString().slice(0, 19).replace('T', ' ');

        const query = `
            SELECT name, startTime, endTime, categories
            FROM events
            WHERE (startTime < ? AND endTime > ?)
               OR (startTime < ? AND endTime > ?)
               OR (startTime >= ? AND startTime <= ?)
               OR (endTime >= ? AND endTime <= ?)
            ORDER BY startTime ASC;
        `;
        console.log(`Executing query: ${query} ${startTime} ${endTime}`);
        con.query(query, [endTime, startTime, endTime, startTime, startTime, endTime, startTime, endTime], (err: any, results: any[]) => {
            if (err) {
                return reject(err);
            }
            const events: CalendarEvent[] = results.map((row: any) => ({
                name: row.name,
                startTime: new Date(row.startTime),
                endTime: new Date(row.endTime),
                categories: row.categories ? row.categories.split(', ') : undefined
            }));
            resolve(events);
        });
    });
}

function getDayEmoji(date: Date): string {
    const dayOfWeek = date.getDay();
    switch (dayOfWeek) {
        case 0:
            return EMOJI_SUNDAY;
        case 1:
            return EMOJI_MONDAY;
        case 2:
            return EMOJI_TUESDAY;
        case 3:
            return EMOJI_WEDNESDAY;
        case 4:
            return EMOJI_THURSDAY;
        case 5:
            return EMOJI_FRIDAY;
        case 6:
            return EMOJI_SATURDAY;
        default:
            throw new Error("Invalid day of the week");
    }
}