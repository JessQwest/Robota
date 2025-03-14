import { interactionCreateCommand } from "./action_interactionCreateCommand"
import * as dotenv from 'dotenv'
import { CacheType, GuildTextBasedChannel, Interaction, Message } from "discord.js"
import * as db_setup from './db_setup'
import * as scheduled_jobs from './scheduled_jobs'
import { hourlyHousekeepTask } from './scheduled_jobs'
import * as command_management from './command_management'
import { messageCreate } from "./action_messageCreate"
import { AuthType, createClient, WebDAVClient } from "webdav"

var cron = require('node-cron')
const config = require("config")

dotenv.config()
const mysql = require('mysql2')

const {Client, GatewayIntentBits, Partials} = require('discord.js')

function loadOption(key: string): any {
    const modifiedKey = key.replace(/\./g, '_')
    if (process.env[modifiedKey] !== undefined) {
        return process.env[modifiedKey]
    }
    return config.get(key)
}


// debug constants
export var DEBUGMODE = loadOption('debug-mode.enabled')
export const DEBUG_SERVER_ID = loadOption('debug-mode.debug-server-id')
export const DEBUG_CHANNEL_ID = loadOption('debug-mode.debug-channel-id')

export const LOGGING_SERVER_ID = loadOption('server-info.logging-server-id')
export const LOGGING_CHANNEL_ID = loadOption('server-info.logging-channel-id')

console.log(`Running with debug mode set to ${DEBUGMODE}`)

// text constants

export const EMOJI_MONDAY = loadOption('emoji.monday')
export const EMOJI_TUESDAY = loadOption('emoji.tuesday')
export const EMOJI_WEDNESDAY = loadOption('emoji.wednesday')
export const EMOJI_THURSDAY = loadOption('emoji.thursday')
export const EMOJI_FRIDAY = loadOption('emoji.friday')
export const EMOJI_SATURDAY = loadOption('emoji.saturday')
export const EMOJI_SUNDAY = loadOption('emoji.sunday')

// channel constants

export const SCHEDULE_BROADCAST_CHANNEL = loadOption('server-info.schedule-broadcast-channel')

// server constants
export const MAIN_SERVER_ID = loadOption('server-info.server-id')
export const ICS_CHANNEL_LISTENER = loadOption('server-info.ics-channel-listener')
export const SILLY_VIDEO_CHANNEL_LISTENER = loadOption('server-info.silly-video-channel-listener')

//webdav constants

export const WEBDAV_ENABLED = loadOption('webdav.enabled')
export const WEBDAV_AUTHTYPE = loadOption('webdav.authtype')
export const WEBDAV_URL = loadOption('webdav.url')
export const WEBDAV_USERNAME = loadOption('webdav.username')
export const WEBDAV_PASSWORD = loadOption('webdav.password')
export const WEBDAV_FILEPATH = loadOption('webdav.filepath')

// other constants
export const ADMIN_USER_ID = loadOption('server-info.admin-user-id')

//CONSTANTS END

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
    ]
})

export var webdavClient: WebDAVClient | null = null

if (WEBDAV_ENABLED) {
    webdavClient = createClient(WEBDAV_URL, {
        authType: WEBDAV_AUTHTYPE as AuthType,
        username: WEBDAV_USERNAME,
        password: WEBDAV_PASSWORD
    });
}

const dbHost: String = DEBUGMODE ? loadOption('debug-mode.debughost') : loadOption('database.host')
const dbPort: String = DEBUGMODE ? loadOption('debug-mode.debugport') : loadOption('database.port')
const dbUser: String = DEBUGMODE ? loadOption('debug-mode.debuguser') : loadOption('database.user')
const dbPassword: String = DEBUGMODE ? loadOption('debug-mode.debugpassword') : loadOption('database.password')
const dbDatabase: String = DEBUGMODE ? loadOption('debug-mode.debugdatabase') : loadOption('database.database')

console.log(`Attempting to create SQL connection to db ${dbDatabase} with ${dbHost}:${dbPort} ${dbUser}/${dbPassword}`)
export const con = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase
})

export var debugchannel: GuildTextBasedChannel
export var loggingchannel: GuildTextBasedChannel

client.on('ready', async () => {

    console.log("Environment Variables:")
    for (const [key, value] of Object.entries(process.env)) {
        console.log(`${key}: ${value}`)
    }

    db_setup.setupDatabaseTables()

    command_management.registerCommands()

    if (client.user != null) {
        await hourlyHousekeepTask()
        //client.user.setActivity(`Happy to help!`)
    }

    debugchannel = await client.channels.fetch(DEBUG_CHANNEL_ID) as GuildTextBasedChannel
    loggingchannel = await client.channels.fetch(LOGGING_CHANNEL_ID) as GuildTextBasedChannel


    console.info(`The bot is ready ${new Date().toISOString()}`)

    await loggingchannel.send("Bot Started")
})

client.on('messageCreate', async (message: Message) => {
    await messageCreate(client, message)
})

client.on('interactionCreate', async (i: Interaction<CacheType>) => {
    await interactionCreateCommand(client, i)
})

// hourly housekeep
cron.schedule('0 * * * *', async () => {
    await scheduled_jobs.hourlyHousekeepTask()
})

// daily announcement
cron.schedule('30 13 * * *', async () => { // 1.30pm daily
    await scheduled_jobs.dailyAnnouncementTask()
})

// monday announcement
cron.schedule('1 0 * * 1', async () => { // 12:01am on monday
    await scheduled_jobs.mondayAnnouncementTask()
})

// saturday announcement
cron.schedule('0 18 * * 5', async () => { // every 6pm on friday
    await scheduled_jobs.weekendAnnouncementTask()
})

process.on('unhandledRejection', error => {
    console.warn(`error time ${new Date().toISOString()}`)
    console.error('Unhandled promise rejection:', error)
    if (error == null || !(error instanceof Error)) {
        console.log(`Error is invalid (jx0032)`)
        return
    }
    loggingchannel.send(`Unhandled promise rejection: ${error} \n\n${error.stack}`)
})

client.on('shardError', (error: { stack: any }) => {
    if (loggingchannel === undefined) {
        console.error("You are probably missing your environment key!")
    }
    console.warn(`error time ${new Date().toISOString()}`)
    console.warn('A websocket connection encountered an error:', error)
    loggingchannel.send(`A websocket connection encountered an error: ${error} \n\n${error.stack}`)
})

process.on('uncaughtException', error => {
    console.warn(`error time ${new Date().toISOString()}`)
    console.warn('Unhandled exception:', error)
})

//post all errors into the log channel
const originalError = console.error
console.error = function (...args) {
    // Call the original console.error function to print the error message
    originalError.apply(console, args)
}

client.login(process.env.TOKEN).then(() => {
    console.log("Logged in using token successfully!")
})