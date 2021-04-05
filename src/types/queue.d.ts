import { Channel, DMChannel, NewsChannel, TextChannel, VoiceChannel } from "discord.js";
export interface QueueItem {
    textChannel: TextChannel | DMChannel | NewsChannel,
    voiceChannel: VoiceChannel,
    connection: any,
    songs: Array<any>,
    volume: number,
    playing: Boolean
}