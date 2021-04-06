import { EmbedField, MessageEmbed } from "discord.js";
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