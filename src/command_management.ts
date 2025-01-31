import * as DiscordJS from "discord.js"
import {client} from "./index"

export function registerCommands() {
/*
    const testGuildID = '772844397020184576'
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
}