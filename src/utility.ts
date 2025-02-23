import * as DiscordJS from "discord.js"
import { ColorResolvable, EmbedBuilder } from "discord.js"
import fetch from "node-fetch"

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

export function stringToEmbeds(title: string, description: string, color: ColorResolvable = "#208386", footer: string | null = null): EmbedBuilder[] {
    const embeds: EmbedBuilder[] = []
    const lines = groupLines(description)
    let setTitle = false

    if (lines.length === 0) {
        let blankEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)

        if (footer != null) {
            blankEmbed.setFooter({ text: footer })
        }

        embeds.push(blankEmbed)
    } else {
        for (const line of lines) {
            let nextEmbed = new EmbedBuilder()
                .setColor(color)
                .setDescription(line)

            if (!setTitle) {
                nextEmbed.setTitle(title)
                setTitle = true
            }

            embeds.push(nextEmbed)
        }

        if (footer != null && embeds.length >= 1) {
            embeds[embeds.length - 1].setFooter({ text: footer })
        }
    }

    return embeds
}


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

export async function dataFetch(data_url: string) : Promise<string> {
    try {
        const response = await fetch(data_url);
        const fileContent = await response.text();
        return fileContent
    } catch (error) {
        console.error(`Failed to fetch file: ${error}`);
        throw error
    }
    return ""
}


export type TimestampType = "d" | "D" | "t" | "T" | "f" | "F" | "R"

export type StartEndTime = "start" | "end"

export function dateToDiscordTimestamp(date: Date, timestampType: TimestampType = "f", startEndTime: StartEndTime | null = null): string {
    let modifiedDate = date
    if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
        let timeModifier = 12 * 60 * 60 * 1000
        if (startEndTime === "end") timeModifier *= -1
        modifiedDate = new Date(date.getTime() + timeModifier);
        timestampType = "D";
    }
    const unixTimestamp = Math.floor(modifiedDate.getTime() / 1000);
    return `<t:${unixTimestamp}:${timestampType}>`;
}