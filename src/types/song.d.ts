export interface Song {
    title: string,
    url?: string,
    poster?: string;
    pic?: string;
    src: 'yt' | 'spot';
}
export interface RedisSaveSongs {
    songs: Song[]
}