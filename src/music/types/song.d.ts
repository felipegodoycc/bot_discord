export interface Song {
    title: string,
    url?: string,
    poster?: string;
    pic?: string;
    src: 'yt' | 'spot';
}

export type YoutubePlaylist {
    title: string;
    items: Song[];
}
export interface RedisSaveSongs {
    songs: Song[]
}