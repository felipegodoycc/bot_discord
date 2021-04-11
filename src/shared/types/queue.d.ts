import { Channel, DMChannel, Guild, NewsChannel, TextChannel, VoiceChannel, VoiceConnection } from "discord.js";
import { Song } from "../../music/types/song";
export interface QueueItem {
    textChannel: TextChannel | DMChannel | NewsChannel,
    voiceChannel: VoiceChannel,
    connection: VoiceConnection,
    songs: Array<Song>,
    volume: number,
    playing: boolean,
    guild: Guild,
    config?: ConfigServer
    
}

export interface ConfigServer {
    prefix: string,
    lschannel?: string,
    plimit?: number,
    dmtchannel?: string,
}