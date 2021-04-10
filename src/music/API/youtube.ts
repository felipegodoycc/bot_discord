import ytdl from "ytdl-core";
import ytsr from "ytsr";
import ytpl from "ytpl";

import { Song, YoutubePlaylist } from "../types/song";
import { PLAYLIST_LIMIT } from "../../config";

export function getYoutubeLink(toSearch: string): Promise<string>{
    return new Promise( async (resolve) => {
        const filters = await ytsr.getFilters(`${toSearch}`);
        const filter = filters.get('Type').get('Video');
        const search: any = await ytsr(filter.url, { limit: 5 });
        resolve(search.items[0].url)
    })
}

export async function getYoutubeSong(link: string){
    const songInfo = await ytdl.getInfo(link);
    const song : Song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        src: 'yt'
    };
    return song;
}

export async function searchAndGetYoutubeSong(toSearch): Promise<Song> {
    try {
        console.log("BUSCANDO: ", toSearch)
        const ytLink = await getYoutubeLink(toSearch);
        console.log("LINK: ", ytLink)
        const ytSong = await getYoutubeSong(ytLink);  
        console.log("SONGINFO: ", ytSong)
        return ytSong  
    } catch (error) {
        console.log("ERROR YT: ", error)
        return Promise.reject(error)        
    }
}

export async function getSongsFromPlaylist(link: string): Promise<YoutubePlaylist>{
    try {
        const playlistId = await ytpl.getPlaylistID(link);
        const playlist = await ytpl(playlistId);
        const songs: Song[] = [];
        playlist.items.slice(0,PLAYLIST_LIMIT).map( s => {
            songs.push({
                title: s.title,
                url: s.url,
                src: "yt"
            })
        })
        return {
            title: playlist.title,
            items: songs
        };
    } catch (error) {
        console.log("ERROR YTPL: ", error)
        return Promise.reject(error)            
    }
    
}