import * as DiscordJS from "discord.js"
import { client, DEBUG_SERVER_ID } from "./index"

export function registerCommands() {

    const testGuildID = DEBUG_SERVER_ID
    const testGuild = client.guilds.cache.get(testGuildID)

    let commands

    if (testGuild) {
        commands = testGuild.commands
    }
    else {
        commands = client.application?.commands
    }

    /* PROCESS TO DELETE COMMAND*/
    /*
   // @ts-ignore
   client.application.commands.fetch('975103804766842971') // id of your command to delete
       .then( (command) => {
           console.log(`Fetched command ${command.name}`)
           // further delete it like so:
           command.delete()
           console.log(`Deleted command ${command.name}`)
       }).catch(console.error)
    */

    commands?.create({
        name: 'thisweek',
        description: "What's going on this week?"
    })

    commands?.create({
        name: 'today',
        description: "What's happening today?"
    })

    commands?.create({
        name: 'tomorrow',
        description: "What's happening today?"
    })

    commands?.create({
        name: 'nextweek',
        description: "What's happening next week?"
    })

    commands?.create({
        name: 'weekend',
        description: "What's happening this weekend?"
    })
}