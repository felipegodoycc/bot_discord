import { User } from "discord.js";

export interface Song {
    title: string,
    url?: string,
    poster?: string;
    pic?: string;
    src: 'yt' | 'spot';
    requestedBy?: string;
}

export interface YoutubePlaylist {
    title: string;
    items: Song[];
}
export interface RedisSaveSongs {
    songs: Song[]
}