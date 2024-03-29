import { EmbedField, Message, MessageEmbed } from "discord.js";
import { ConfigServer } from "../shared/types/queue";
import { Song } from "./types/song";

export function isUrl(data: string): Boolean{
    return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(data);
}

export function createEmbebedMessageSongs(songs: Song[]): MessageEmbed {
    const songsList : Array<EmbedField> = []
    songs.map( (item) =>{
        const content = `Titulo: ${item.title} - Solicitado por: ${item.requestedBy}`
        songsList.push({ name: songsList.length.toString(), value: content, inline: false })
    })
    const embed = new MessageEmbed()
        .setTitle("Lista de canciones en la cola")
        .addFields(songsList);
    return embed;
}

export function createEmbebedMessageSettings(config: ConfigServer, desc): MessageEmbed {
    const settingsValue: Array<EmbedField> = [];
    Object.keys(config).map( (cf) =>{
        const com = `${cf} <valor>`
        const description = `${desc[cf]} - Actual: ${config[cf]}`
        settingsValue.push({ name: com, value: description, inline: false })
    })
    const embed = new MessageEmbed()
        .setTitle(`Configuracion actual del servidor`)
        .addFields(settingsValue);
    return embed;
}

export function createEmbebedMessageCommands(commmands, desc, prefix): MessageEmbed {
    const settingsValue: Array<EmbedField> = [];
    Object.keys(commmands).map( (cf) =>{
        const description = `${String(desc[cf]).format(prefix, commmands[cf])}`
        settingsValue.push({ name: commmands[cf], value: description, inline: false })
    })
    const embed = new MessageEmbed()
        .setTitle(`Comandos bot musica`)
        .addFields(settingsValue);
    return embed;
}

export function sleep(ms: number): Promise<void>{
    return new Promise( (resolve) => {
        setInterval( () => resolve(), ms)
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

export function shuffle<T>(array: Array<T>): Array<T> {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}