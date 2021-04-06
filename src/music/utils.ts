import { EmbedField, Message, MessageEmbed } from "discord.js";
import ytsr from "ytsr";
import { Song } from "../types/song";

export function isUrl(data: string): Boolean{
    return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(data);
}

export function createEmbebedMessage(songs: Song[]): MessageEmbed {
    const songsList : Array<EmbedField> = []
    songs.map( (item) => songsList.push({ name: songsList.length.toString(), value: item.title, inline: true }))
    const embed = new MessageEmbed()
        .setTitle("Lista de canciones en la cola")
        .addFields(songsList);
    return embed;
}

export function sleep(ms: number): Promise<void>{
    return new Promise( (resolve) => {
        setInterval( () => resolve(), ms)
    })
}

export function getLink(toSearch: string): Promise<string>{
    return new Promise( async (resolve) => {
        const filters = await ytsr.getFilters(toSearch);
        const filter = filters.get('Type').get('Video');
        const search: any = await ytsr(filter.url, { limit: 5 });
        resolve(search.items[0].url)
    })
}

export function getParamsFromMessage(message: Message){
    const msg = message.content;
    console.log(message.content.split(' '))
    const [ ,command, ...resto ] = msg.split(' ');
    console.log('Mensaje: ', command, ' - request: ', resto.join(' '))
    return {
        command,
        request: resto.join(' ')
    }
}