import ytdl from "ytdl-core";
import ytsr from "ytsr";
import { Song } from "../types/song";

export function getYoutubeLink(toSearch: string): Promise<string>{
    return new Promise( async (resolve) => {
        const filters = await ytsr.getFilters(`${toSearch} visualizer`);
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
        
    }
}