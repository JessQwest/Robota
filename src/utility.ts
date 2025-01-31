import { ADMIN_LIST } from "./index"
import * as DiscordJS from "discord.js"
import { ColorResolvable } from "discord.js"

export function escapeFormatting(input: string): string {
    if (input.includes("\\")) {
        console.log("The string seems to already be escaped (jx0028)")
        return input
    }
    // removes redundant discriminator
    if (input.endsWith("#0")) {
        input = input.slice(0, -2)
    }
    return input.replaceAll("_","\\_")
}

export function unescapeFormatting(input: string) {
    return input.replaceAll("\\","")
}

export function capitalizeFirstLetter(input: string) {
    return input.charAt(0).toUpperCase() + input.slice(1)
}

export function getDiscordDisplayName(DiscordUser: DiscordJS.User) {
    if (DiscordUser.discriminator != "0") return `@${DiscordUser.username}#${DiscordUser.discriminator}`
    return `@${DiscordUser.username}`
}

/*
export function stringToEmbeds(title: string, description: string, color: ColorResolvable = "#208386", footer: string | null = null): DiscordJS.MessageEmbed[] {
    const embeds: DiscordJS.MessageEmbed[] = []
    const lines = groupLines(description)
    let setTitle = false
    for (const line of lines) {
        let nextEmbed = new DiscordJS.MessageEmbed()
            .setColor(color)
            .setDescription(line)

        if (!setTitle) {
            nextEmbed.setTitle(title)
            setTitle = true
        }

        embeds.push(nextEmbed)
    }

    if (footer != null && embeds.length >= 1) {
        embeds[embeds.length - 1].footer = {text: footer}
    }

    return embeds
}*/


function groupLines(inputString: string): string[] {
    const lines = inputString.split('\n')
    const groupedLines: string[] = []
    let currentGroup: string[] = []

    for (const line of lines) {
        if (currentGroup.join('\n').length + line.length <= 4000) {
            currentGroup.push(line)
        } else {
            groupedLines.push(currentGroup.join('\n'))
            currentGroup = [line]
        }
    }

    if (currentGroup.length > 0) {
        groupedLines.push(currentGroup.join('\n'))
    }

    return groupedLines
}

export function hasAdminPerms(userId: string | null | undefined): boolean {
    if (userId == null) return false
    const isAdmin = ADMIN_LIST.includes(userId)
    return isAdmin
}

export function formatListOfStrings(strings: string[]): string {
    if (strings.length === 0) {
        return '';
    } else if (strings.length === 1) {
        return strings[0];
    } else {
        const allButLast = strings.slice(0, -1).join(', ')
        const last = strings[strings.length - 1]
        return `${allButLast} and ${last}`
    }
}