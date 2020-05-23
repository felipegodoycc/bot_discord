import ytdl, { getInfo } from "ytdl-core";
import ytsr, { getFilters } from 'ytsr';
import { messages } from './config.json';
 
const queue = new Map();
let serverQueue;

export const initMusicModule = (message) => {
    serverQueue = queue.get(message.guild.id);
}

export async function execute(message) {
    const args = message.content.replace("!play", "").trim();
    let link = "";
    if (!isurl(args)) {
        link = await getLink(args);
    } else {
        link = args;
    }


    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(messages.NOT_VOICE_CHANNEL);
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(messages.NOT_VOICE_PERMISSION);
    }

    const songInfo = await getInfo(link);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(messages.ADD_SONG.format(song.title));
    }
}

export function skip(message) {
    if (!message.member.voice.channel)
        return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
    if (!serverQueue)
        return message.channel.send(messages.EMPTY_QUEUE);
    serverQueue.connection.dispatcher.end();
}

export function stop(message) {
    if (!message.member.voice.channel)
        return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

export function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(messages.PLAY_SONG.format(song.title));
}

const isurl = (data) => {
    return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(data);
}

const getLink = (searchs) => {
    return new Promise((resolve) => {
        getFilters(searchs).then(async(response) => {
            let filter = response.get('Type').find(o => o.name === 'Video');
            let options = {
                limit: 5,
                nextpageRef: filter.ref,
            }
            let results = await ytsr(null, options);
            resolve(results.items[0].link)
        });
    })

}