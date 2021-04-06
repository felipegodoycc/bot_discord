export interface Song {
    title: string,
    url: string
}

export interface RedisSaveSongs {
    songs: Song[]
}