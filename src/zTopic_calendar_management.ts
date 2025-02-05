import ical, { CalendarResponse, PropertyWithArgs, VEvent } from "node-ical"
import { con } from "./index"
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
                const startTime = vEvent.start;
                const endTime = vEvent.end;
                const summaryObj = vEvent.summary as unknown as PropertyWithArgs<any>;
                const summary = summaryObj.val;
                const categories = vEvent.categories;

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

    await persistEventsToDatabase(events);
}

async function persistEventsToDatabase(events: CalendarEvent[]) {
    if (events.length > 0) {
        con.query('DELETE FROM `events`', function (err: any, result: any, fields: any) {
            if (err) throw err;
            console.log("All current records deleted from events table");
        });
    }

    for (const event of events) {
        con.query('INSERT INTO `events` (`name`, `startTime`, `endTime`, `categories`) VALUES (?, ?, ?, ?)',
            [event.name, event.startTime, event.endTime, event.categories?.join(', ')],
            function (err: any, result: any, fields: any) {
                if (err) throw err;
                console.log("Event inserted into database");
            });
    }
}

export async function getThisWeekCalendarEvents(): Promise<CalendarEvent[]> {
    const startTime = new Date();
    const day = startTime.getDay();
    const diff = startTime.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startTime.setDate(diff);
    startTime.setHours(0, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setDate(startTime.getDate() + 6);
    endTime.setHours(23, 59, 59, 999);

    return await getOverlappingEvents(startTime, endTime);
}

export async function getTodayCalendarEvents(): Promise<CalendarEvent[]> {
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0);

    const endTime = new Date();
    endTime.setHours(23, 59, 59, 999);

    return await getOverlappingEvents(startTime, endTime);
}

export function formatCalendarEvents(events: CalendarEvent[]): string {
    return events.map(event => {
        const startTime = event.startTime;
        const endTime = event.endTime;

        if (startTime.getHours() === 0 && startTime.getMinutes() === 0 && startTime.getSeconds() === 0 &&
            endTime.getHours() === 0 && endTime.getMinutes() === 0 && endTime.getSeconds() === 0 &&
            endTime.getTime() - startTime.getTime() === 24 * 60 * 60 * 1000) {
            return `${dateToDiscordTimestamp(startTime, "D")}: ${event.name}`;
        } else {
            const formattedStartTime = dateToDiscordTimestamp(startTime, "f");
            const formattedEndTime = dateToDiscordTimestamp(endTime, "t");
            return `${formattedStartTime} - ${formattedEndTime}: ${event.name}`;
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