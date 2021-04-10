import { Guild, Message } from 'discord.js';
import ytdl from 'ytdl-core-discord';
import { DEDICATED_MUSIC_TEXT_CHANNEL, MESSAGES, PLAYLIST_LIMIT } from '../config';
import { QueueItem } from './types/queue';
import { RedisSaveSongs, Song } from './types/song';
import { createEmbebedMessage, getParamsFromMessage, isUrl, sleep } from './utils';
import '../types/string.extend';
import { RedisService } from '../redis/redis';
import { commands } from './commands';
import { SpotifyService } from './API/spotify';
import { getSongsFromPlaylist, getYoutubeSong, searchAndGetYoutubeSong } from './API/youtube';

export class MusicBot {

    private queue:Map<string, QueueItem> = new Map<string, QueueItem>();;
    private redisClient: RedisService = new RedisService();
    private spotifyClient: SpotifyService = new SpotifyService();
    private message: Message = null;

    constructor(){
    }

    private getServerQueue(guild: Guild){
        console.log("ServerID: ", guild.name)
        const queue = this.queue.get(guild.id);
        return queue
    }

    private setMessage(message: Message){
        this.message = message;
    }

    executeCommand(message: Message){
        this.setMessage(message)
        const { command, request } = getParamsFromMessage(message);
        switch (command) {
            case commands.PLAY:
                this.execute(request);
                break;
            case commands.SKIP:
                this.skip();
                break;
            case commands.STOP:
                this.stop();
                break;
            case commands.GET_QUEUE:
                this.showQueue();
                break;
            case commands.SKIP_TO:
                this.skipTo(request);
                break;
            case commands.RESUME:
                this.resume();
                break;
            case commands.CLEAN:
                this.clean();
                break;
            case commands.SETUP:
                this.createDedicatedChannel();
                break;
            default:
                message.channel.send(MESSAGES.INVALID_COMMAND);
                break;
        }
    }

    private initializeServerQeue(): QueueItem{
        const message = this.message;
        const queueContruct: QueueItem = {
            textChannel: message.channel,
            voiceChannel: message.member.voice.channel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
            guild: message.guild
        };
        this.queue.set(message.guild.id, queueContruct);
        return queueContruct         
    }

    private async execute(args: string) {
        const message = this.message;
        try {
            const serverQueue = this.getServerQueue(message.guild);
    
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.send(MESSAGES.NOT_VOICE_CHANNEL);
            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return message.channel.send(MESSAGES.NOT_VOICE_PERMISSION);
            }
            if (!serverQueue) {
                const queueContruct: QueueItem = this.initializeServerQeue();
                await this.loadSong(args, queueContruct);
                return this.startReproduction(queueContruct)
            } else {
                const song = await this.loadSong(args, serverQueue);
                return message.channel.send(MESSAGES.ADD_SONG.format(song));
            }            
        } catch (error) {
            console.log("ERROR EN EXECUTE: ", error)            
        }
    }

    private async resume() {
        const message = this.message;
        const songs = await this.loadServerQueue(message.guild);
        const serverQueue = this.initializeServerQeue();
        serverQueue.songs = songs;
        this.startReproduction(serverQueue);
        this.showQueue();
    }
    
    private skip() {
        const message = this.message;
        const serverQueue = this.getServerQueue(message.guild);
        if (!message.member.voice.channel)
            return message.channel.send(MESSAGES.MEMBER_NOT_IN_VOICE_CHANNEL);
        if (!serverQueue)
            return message.channel.send(MESSAGES.EMPTY_QUEUE);
        serverQueue.connection.dispatcher.end();
    }

    private skipTo(positionToSkip: string | number){
        const message = this.message;
        const serverQueue = this.getServerQueue(message.guild);
        positionToSkip = Number(positionToSkip);
        if (!serverQueue)
            return message.channel.send(MESSAGES.EMPTY_QUEUE);
        if (!message.member.voice.channel)
            return message.channel.send(MESSAGES.MEMBER_NOT_IN_VOICE_CHANNEL);
        if (positionToSkip > serverQueue.songs.length)
            return message.channel.send(MESSAGES.OUT_OF_QUEUE_RANGE);
        serverQueue.songs = serverQueue.songs.slice(positionToSkip-1);
        serverQueue.connection.dispatcher.end();
    }

    private stop() {
        const message = this.message;
        const serverQueue = this.getServerQueue(message.guild);
        if (!message.member.voice.channel)
            return message.channel.send(MESSAGES.MEMBER_NOT_IN_VOICE_CHANNEL);
        serverQueue.songs = []
        serverQueue.connection.dispatcher.end();
    }

    private clean(){
        const message = this.message;
        const serverQueue = this.getServerQueue(message.guild);
        if (!message.member.voice.channel)
            return message.channel.send(MESSAGES.MEMBER_NOT_IN_VOICE_CHANNEL);
        if(!serverQueue) return this.deleteServerQueue(message.guild);
        serverQueue.songs = []
        this.saveServerQueue(serverQueue);
    }

    private async startReproduction(serverQueue: QueueItem){
        const message = this.message;
        try {
            var connection = await message.member.voice.channel.join();
            serverQueue.connection = connection;
            await this.play(serverQueue.songs[0]);
        } catch (err) {
            console.log(err);
            this.queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }

    private async play(song: Song) {
        try {
            const guild = this.message.guild;
            const serverQueue = this.getServerQueue(guild);
            if (!song) {
                console.log("No quedan videos")
                await sleep(5000);
                serverQueue.voiceChannel.leave();
                this.queue.delete(guild.id);
                return;
            }
            if(song.src === 'spot'){
                const ytSong = await searchAndGetYoutubeSong(song.title);
                song.url = ytSong.url            
            }
            const video = await ytdl(song.url);
            const dispatcher = serverQueue.connection
                .play(video, { type: 'opus' })
                .on("finish", async () => {
                    serverQueue.songs.shift();
                    await this.play(serverQueue.songs[0]);
                })
                .on("error", error => console.error(error));
            dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
            serverQueue.textChannel.send(MESSAGES.PLAY_SONG.format(song.title));            
        } catch (error) {
            console.log("ERROR EN PLAY: ", error)            
        }
    }

    private showQueue(){
        const message = this.message;
        const serverQueue = this.getServerQueue(message.guild);
        console.log("Queue: ", serverQueue?.songs)
        if(!serverQueue){ message.channel.send(MESSAGES.NOT_QUEUE_EXIST); return}
        message.channel.send(createEmbebedMessage(serverQueue.songs))
    }

    private addSong(serverQueue: QueueItem, ...songs: Song[]){
        songs.map( song => serverQueue.songs.push(song));        
        this.saveServerQueue(serverQueue)
    }

    private async loadSong(args: string, serverQueue: QueueItem): Promise<String>{
        try {
            if(!isUrl(args)){
                const ytSong = await searchAndGetYoutubeSong(args)
                this.addSong(serverQueue, ytSong)
                return ytSong.title
            } else {
                if(args.includes("spotify")){
                    const idPlaylist = args.split("/").pop();
                    const spotifySongs = await this.spotifyClient.getPlaylist(idPlaylist);
                    const sp = spotifySongs.tracks.slice(0,PLAYLIST_LIMIT);
                    sp.map( track => serverQueue.songs.push({ title: `${track.title} ${track.poster}`, src: "spot" }))
                    return(spotifySongs.name)
                } else if(args.includes("youtu")) {
                    if(args.includes("list")){
                        const songs = await getSongsFromPlaylist(args);
                        this.addSong(serverQueue, ...songs.items);
                        return(songs.title);
                    }
                    const ytSong = await getYoutubeSong(args);
                    this.addSong(serverQueue, ytSong);
                    return(ytSong.title)
                } else {
                    serverQueue.textChannel.send(MESSAGES.NOT_ALLOWED_ORIGIN)
                    Promise.reject(MESSAGES.NOT_ALLOWED_ORIGIN)
                }
            }
        } catch (error) {
            console.log("LOAD ERROR: ", error)            
        }
    }

    private async saveServerQueue(queue: QueueItem){
        const saveQueue: RedisSaveSongs = {
            songs: queue.songs
        }
        await this.redisClient.setObject(queue.guild.id, saveQueue)
    }
    
    private async loadServerQueue(guild: Guild){
        const { songs } = await this.redisClient.getObject<RedisSaveSongs>(guild.id);
        return songs;
    }

    private async deleteServerQueue(guild: Guild){
        await this.redisClient.delete(guild.id)
    }

    private async createDedicatedChannel(): Promise<void>{
        const server = this.message.guild;
        if(server.channels.cache.find( ch => ch.name === DEDICATED_MUSIC_TEXT_CHANNEL)){
            this.message.reply(MESSAGES.DEDICATED_CHANNEL_EXIST);
            return;
        }
        const newChannel = await server.channels.create(DEDICATED_MUSIC_TEXT_CHANNEL, { type: 'text', reason: 'Porque si' });
        this.message.reply(MESSAGES.DEDICATE_CHANNEL_SUCCESFULL.format(newChannel))
        newChannel.send(MESSAGES.WELCOME_DEDICATED_MUSIC_CHANNEL);
        return;
    }

    public listenDedicatedChannel(message: Message){
        if(this.checkIfContainCommand(message)){ return message.reply(MESSAGES.NOT_COMMAND_HERE)}
        this.setMessage(message);
        this.execute(message.content);
    }

    private checkIfContainCommand(message: Message){
        const result = Object.keys(commands).find( com => message.content.toLocaleLowerCase().includes(commands[com]))
        console.log("ES COMANDO? : ", result != undefined)
        return result != undefined
    }
}


 
