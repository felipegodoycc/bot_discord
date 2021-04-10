import { Channel, DMChannel, Guild, NewsChannel, TextChannel, VoiceChannel, VoiceConnection } from "discord.js";
import { Song } from "./song";
export interface QueueItem {
    textChannel: TextChannel | DMChannel | NewsChannel,
    voiceChannel: VoiceChannel,
    connection: VoiceConnection,
    songs: Array<Song>,
    volume: number,
    playing: Boolean,
    guild: Guild
}