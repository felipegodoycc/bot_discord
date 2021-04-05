import { Message } from 'discord.js';
import ytdl from 'ytdl-core-discord';
import ytsr from 'ytsr';
import { messages } from './config';
import { QueueItem } from './types/queue.type';
import { Song } from './types/song.type';

export class MusicBot {

    private queue:Map<string, QueueItem> = new Map<string, QueueItem>();;

    constructor(){
    }

    getServerQueue(message: Message){
        return this.queue.get(message.guild.id);
    }

    async execute(message: Message) {
        const serverQueue = this.getServerQueue(message);
        const args = message.content.replace("!play", "").trim();
        const link: string = !this.isUrl(args) ? await this.getLink(args) : args;

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return message.channel.send(messages.NOT_VOICE_CHANNEL);
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send(messages.NOT_VOICE_PERMISSION);
        }

        const songInfo = await ytdl.getInfo(link);
        const song : Song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url
        };
        console.log("SONG: ", song)

        if (!serverQueue) {
            const queueContruct: QueueItem = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };

            this.queue.set(message.guild.id, queueContruct);
            queueContruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                await this.play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.log(err);
                this.queue.delete(message.guild.id);
                return message.channel.send(err);
            }
        } else {
            serverQueue.songs.push(song);
            return message.channel.send(messages.ADD_SONG.format(song.title));
        }
    }

    skip(message: Message) {
        const serverQueue = this.getServerQueue(message);
        if (!message.member.voice.channel)
            return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
        if (!serverQueue)
            return message.channel.send(messages.EMPTY_QUEUE);
        serverQueue.connection.dispatcher.end();
    }

    stop(message: Message) {
        const serverQueue = this.getServerQueue(message);
        if (!message.member.voice.channel)
            return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }

    async play(guild, song) {
        const serverQueue = this.getServerQueue(guild.id);
        if (!song) {
            console.log("No quedan videos")
            serverQueue.voiceChannel.leave();
            this.queue.delete(guild.id);
            return;
        }
        console.log("Buscando video: ", song.url )
        const video = await ytdl(song.url);
        console.log("Video: ", video);
        const dispatcher = serverQueue.connection
            .play(video, { type: 'opus' })
            .on("finish", async () => {
                serverQueue.songs.shift();
                await this.play(guild, serverQueue.songs[0]);
            })
            .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.textChannel.send(messages.PLAY_SONG.format(song.title));
    }

    isUrl(data: string): Boolean{
        return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(data);
    }

    getLink(toSearch: string): Promise<string>{
        return new Promise( async (resolve) => {
            const filters = await ytsr.getFilters(toSearch);
            const filter = filters.get('Type').find(a => a.label === 'Video');
            const search: any = await ytsr(filter.query, { limit: 25 });
            console.log("Search: ", search);
            resolve(search.items[0].link)
        })
    }
}
 
