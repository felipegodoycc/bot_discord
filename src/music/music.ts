import { Guild, Message } from 'discord.js';
import ytdl from 'ytdl-core-discord';
import { messages } from '../config';
import { QueueItem } from '../types/queue';
import { RedisSaveSongs, Song } from '../types/song';
import { createEmbebedMessage, getParamsFromMessage, isUrl, sleep } from './utils';
import '../types/string.extend';
import { RedisService } from '../redis/redis';
import { commands } from './commands';
import { SpotifyService } from './spotify';
import { getLink, getYoutubeSong } from './youtube';

export class MusicBot {

    private queue:Map<string, QueueItem> = new Map<string, QueueItem>();;
    private redisClient: RedisService = new RedisService();
    private spotifyClient: SpotifyService = new SpotifyService();

    constructor(){
        console.log("SPOTIFY: ", this.spotifyClient)
    }

    getServerQueue(guild: Guild){
        console.log("ServerID: ", guild.id)
        return this.queue.get(guild.id);
    }

    executeCommand(message: Message){
        const { command, request } = getParamsFromMessage(message);
        switch (command) {
            case commands.PLAY:
                this.execute(message, request);
                break;
            case commands.SKIP:
                this.skip(message);
                break;
            case commands.STOP:
                this.stop(message);
                break;
            case commands.GET_QUEUE:
                this.showQueue(message);
                break;
            case commands.SKIP_TO:
                this.skipTo(message, request);
                break;
            case commands.RESUME:
                this.resume(message);
                break;
            default:
                message.channel.send(messages.INVALID_COMMAND);
                break;
        }
    }

    initializeServerQeue(message: Message): QueueItem{
        const queueContruct: QueueItem = {
            textChannel: message.channel,
            voiceChannel: message.member.voice.channel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        this.queue.set(message.guild.id, queueContruct);
        return queueContruct         
    }

    async execute(message: Message, args: string) {
        const serverQueue = this.getServerQueue(message.guild);
        const link: string = !isUrl(args) ? await getLink(args) : args;

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return message.channel.send(messages.NOT_VOICE_CHANNEL);
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send(messages.NOT_VOICE_PERMISSION);
        }

        const song = await getYoutubeSong(link);

        if (!serverQueue) {
            const queueContruct: QueueItem = this.initializeServerQeue(message);
            this.addSong(message.guild, queueContruct, song)

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
            this.addSong(message.guild, serverQueue, song)
            return message.channel.send(messages.ADD_SONG.format(song.title));
        }
    }


    async resume(message: Message) {
        const songs = await this.loadServerQueue(message.guild);
        const serverQueue = this.initializeServerQeue(message);
        serverQueue.songs = songs;
        try {
            var connection = await message.member.voice.channel.join();
            serverQueue.connection = connection;
            this.showQueue(message);
            await this.play(message.guild, serverQueue.songs[0]);
        } catch (err) {
            console.log(err);
            this.queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
    
    skip(message: Message) {
        const serverQueue = this.getServerQueue(message.guild);
        if (!message.member.voice.channel)
            return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
        if (!serverQueue)
            return message.channel.send(messages.EMPTY_QUEUE);
        serverQueue.connection.dispatcher.end();
    }

    skipTo(message: Message, positionToSkip){
        console.log("Position to skip: ", positionToSkip)
        const serverQueue = this.getServerQueue(message.guild);
        if (!serverQueue)
            return message.channel.send(messages.EMPTY_QUEUE);
        if (!message.member.voice.channel)
            return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
        if (positionToSkip > serverQueue.songs.length)
            return message.channel.send(messages.OUT_OF_QUEUE_RANGE);
        serverQueue.songs = serverQueue.songs.slice(positionToSkip-1);
        serverQueue.connection.dispatcher.end();
    }

    stop(message: Message) {
        const serverQueue = this.getServerQueue(message.guild);
        if (!message.member.voice.channel)
            return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
        serverQueue.songs = []
        serverQueue.connection.dispatcher.end();
    }

    clean(message: Message){
        const serverQueue = this.getServerQueue(message.guild);
        if (!message.member.voice.channel)
            return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
        serverQueue.songs = []
        this.saveServerQueue(message.guild, serverQueue);
    }

    async play(guild: Guild, song: Song) {
        const serverQueue = this.getServerQueue(guild);
        if (!song) {
            console.log("No quedan videos")
            await sleep(5000);
            serverQueue.voiceChannel.leave();
            this.queue.delete(guild.id);
            return;
        }
        console.log("Buscando video: ", song.title )
        const video = await ytdl(song.url);
        console.log("Video encontrado!");
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

    showQueue(message: Message){
        const serverQueue = this.getServerQueue(message.guild);
        console.log("Queue: ", serverQueue?.songs)
        if(!serverQueue){ message.channel.send(messages.NOT_QUEUE_EXIST); return}
        message.channel.send(createEmbebedMessage(serverQueue.songs))
    }

    addSong(guild: Guild,serverQueue: QueueItem, song: Song){
        serverQueue.songs.push(song);
        this.saveServerQueue(guild, serverQueue)
    }    

    async saveServerQueue(guild: Guild, queue: QueueItem){
        const saveQueue: RedisSaveSongs = {
            songs: queue.songs
        }
        await this.redisClient.setObject(guild.id, saveQueue)
    }
    
    async loadServerQueue(guild: Guild){
        const { songs } = await this.redisClient.getObject<RedisSaveSongs>(guild.id);
        return songs;
    }
}


 
