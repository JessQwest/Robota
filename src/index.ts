import { interactionCreateCommand } from "./action_interactionCreateCommand"

var cron = require('node-cron')
const config = require("config")
import * as dotenv from 'dotenv'
// @ts-ignore
import { v4 as uuidv4 } from 'uuid'
import { CacheType, GuildTextBasedChannel, Interaction, Message, TextBasedChannel } from "discord.js"

dotenv.config()
const mysql = require('mysql')

import * as db_setup from './db_setup'
import * as scheduled_jobs from './scheduled_jobs'
import * as command_management from './command_management'
import { messageCreate } from "./action_messageCreate"

const {Client, GatewayIntentBits, Partials} = require('discord.js')


// debug constants
export var DEBUGMODE = config.get('debug-mode.enabled')
export const DEBUG_SERVER_ID = config.get('debug-mode.debug-server-id')
export const DEBUG_CHANNEL_ID = config.get('debug-mode.debug-channel-id')

console.log(`Running with debug mode set to ${DEBUGMODE}`)

// text constants

export const EMOJI_MONDAY = config.get('emoji.monday')
export const EMOJI_TUESDAY = config.get('emoji.tuesday')
export const EMOJI_WEDNESDAY = config.get('emoji.wednesday')
export const EMOJI_THURSDAY = config.get('emoji.thursday')
export const EMOJI_FRIDAY = config.get('emoji.friday')
export const EMOJI_SATURDAY = config.get('emoji.saturday')
export const EMOJI_SUNDAY = config.get('emoji.sunday')

// channel constants

// server constants
export const MAIN_SERVER_ID = config.get('server-info.server-id')
export const ICS_CHANNEL_LISTENER = config.get('debug-mode.debug-server-id')

// other constants
export const ADMIN_LIST = config.get('server-info.admin-list').split(",")

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

const dbHost: String = DEBUGMODE ? config.get('debug-mode.debughost') : config.get('database.host')
const dbPort: String = DEBUGMODE ? config.get('debug-mode.debugport') : config.get('database.port')
const dbUser: String = DEBUGMODE ? config.get('debug-mode.debuguser') : config.get('database.user')
const dbPassword: String = DEBUGMODE ? config.get('debug-mode.debugpassword') : config.get('database.password')
const dbDatabase: String = DEBUGMODE ? config.get('debug-mode.debugdatabase') : config.get('database.database')

console.log(`Attempting to create SQL connection to db ${dbDatabase} with ${dbHost}:${dbPort} ${dbUser}/${dbPassword}`)
export const con = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase
})

export var debugchannel: GuildTextBasedChannel

client.on('ready', async () => {

    db_setup.setupDatabaseTables()

    command_management.registerCommands()

    if (client.user != null) {
        client.user.setActivity(`Happy to help!`)
    }

    debugchannel = await client.channels.fetch(DEBUG_CHANNEL_ID) as GuildTextBasedChannel


    console.info(`The bot is ready ${new Date().toISOString()}`)

    await debugchannel.send("Bot Started")
})

client.on('messageCreate', async (message: Message) => {
    await messageCreate(client, message)
})

client.on('interactionCreate', async (i: Interaction<CacheType>) => {
    await interactionCreateCommand(client, i)
})

// hourly housekeep
cron.schedule('* * * * *', async () => { // 0 * * * * for every hour or * * * * * for every min
    await scheduled_jobs.hourlyHousekeepTask()
})

// daily housekeep
cron.schedule('0 7 * * *', async () => { // 0 7 * * * for every 7am or * * * * * for every min
    await scheduled_jobs.dailyHousekeepTask()
})

process.on('unhandledRejection', error => {
    if (debugchannel === undefined) {
        //console.error("You are probably missing your environment key!")
    }
    console.warn(`error time ${new Date().toISOString()}`)
    console.error('Unhandled promise rejection:', error)
    if (error == null || !(error instanceof Error)) {
        console.log(`Error is invalid (jx0032)`)
        return
    }
    debugchannel.send(`Unhandled promise rejection: ${error} \n\n${error.stack}`)
})

client.on('shardError', (error: { stack: any }) => {
    if (debugchannel === undefined) {
        console.error("You are probably missing your environment key!")
    }
    console.warn(`error time ${new Date().toISOString()}`)
    console.warn('A websocket connection encountered an error:', error)
    debugchannel.send(`A websocket connection encountered an error: ${error} \n\n${error.stack}`)
})

process.on('uncaughtException', error => {
    if (debugchannel === undefined) {
        //console.error("You are probably missing your environment key!")
    }
    console.warn(`error time ${new Date().toISOString()}`)
    console.warn('Unhandled exception:', error)
    //debugchannel.send(`Unhandled exception: ${error} \n\n${error.stack}`)
})

//post all errors into the log channel
const originalError = console.error
console.error = function (...args) {
    if (debugchannel === undefined) {
        //console.error("You are probably missing your environment key!")
    }
    //debugchannel.send(`logger.error: ${args.toString()}`)

    // Call the original console.error function to print the error message
    originalError.apply(console, args)
}

client.login(process.env.TOKEN).then(() => {
    console.log("Logged in using token successfully!")
})