import ytdl from "ytdl-core";
import ytsr from "ytsr";
import { Song } from "../types/song";

export function getLink(toSearch: string): Promise<string>{
    return new Promise( async (resolve) => {
        const filters = await ytsr.getFilters(toSearch);
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
    console.log("SONG: ", song);
    return song;
}