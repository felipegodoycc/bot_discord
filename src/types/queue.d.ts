import { Channel, DMChannel, NewsChannel, TextChannel, VoiceChannel, VoiceConnection } from "discord.js";
export interface QueueItem {
    textChannel: TextChannel | DMChannel | NewsChannel,
    voiceChannel: VoiceChannel,
    connection: VoiceConnection,
    songs: Array<any>,
    volume: number,
    playing: Boolean
}