import { Message } from 'discord.js';
import ytdl from 'ytdl-core-discord';
import { MESSAGES, SETTINGS_DESC } from '../config';
import { QueueItem } from '../shared/types/queue';
import { Song } from './types/song';
import { createEmbebedMessageCommands, createEmbebedMessageSettings, createEmbebedMessageSongs, getParamsFromMessage, isUrl, shuffle, sleep } from './utils';
import '../shared/types/string.extend';
import { commands, commandsDescription } from './commands';
import { SpotifyService } from '../shared/services/spotify';
import { getSongsFromPlaylist, getYoutubeSong, searchAndGetYoutubeSong } from './services/youtube';
import { SettingsService } from '../shared/services/settings';
export class MusicBot {
    private spotifyClient: SpotifyService;
    private message: Message;
    private settingsService: SettingsService;
    private serverQueue: QueueItem;

    constructor(services){
        this.spotifyClient = services.spotifyService;
        this.settingsService = services.settingsService
    }

    private async setMessageAndServer(message: Message){
        this.message = message;
        this.serverQueue = await this.settingsService.getServer(message)
    }

    async executeCommand(message: Message){
        await this.setMessageAndServer(message);
        const { command, request } = getParamsFromMessage(message);
        switch (command) {
            case commands.PLAY:
                await this.execute(request);
                break;
            case commands.SKIP:
                await this.skip();
                break;
            case commands.STOP:
                await this.stop();
                break;
            case commands.GET_QUEUE:
                await this.showQueue();
                break;
            case commands.SKIP_TO:
                await this.skipTo(request);
                break;
            case commands.RESUME:
                await this.resume();
                break;
            case commands.CLEAN:
                await this.clean();
                break;
            case commands.SETUP:
                await this.createDedicatedChannel();
                break;
            case commands.SHUFFLE:
                await this.shuffleQueue();
                break;
            case commands.SETTINGS:
                this.setSettings(request);
                break;
            case commands.COMMANDS:
                this.showCommands();
                break
            default:
                message.channel.send(MESSAGES.INVALID_COMMAND);
                this.showCommands();
                break;
        }
        await this.settingsService.saveServerQueue(this.serverQueue);
    }

    private async execute(args: string) {
        const message = this.message;
        const serverQueue = this.serverQueue;
        console.log("Server: ", serverQueue)
        try {
    
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.send(MESSAGES.NOT_VOICE_CHANNEL);
            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return message.channel.send(MESSAGES.NOT_VOICE_PERMISSION);
            }
            if (serverQueue.playing === false) {
                serverQueue.songs = [];
                await this.loadSong(args, serverQueue);
                return this.startReproduction(serverQueue)
            } else {
                const song = await this.loadSong(args, serverQueue);
                return message.channel.send(MESSAGES.ADD_SONG.format(song));
            }            
        } catch (error) {
            console.log("ERROR EN EXECUTE: ", error)            
        }
    }

    private async resume() {
        const serverQueue = this.serverQueue;
        this.startReproduction(serverQueue);
        this.showQueue();
    }
    
    private async skip() {
        const message = this.message;
        const serverQueue = this.serverQueue;
        if (!message.member.voice.channel)
            return message.channel.send(MESSAGES.MEMBER_NOT_IN_VOICE_CHANNEL);
        if (!serverQueue)
            return message.channel.send(MESSAGES.EMPTY_QUEUE);
        serverQueue.connection.dispatcher.end();
    }

    private async skipTo(positionToSkip: string | number){
        const message = this.message;
        const serverQueue = this.serverQueue;
        positionToSkip = Number(positionToSkip);
        if (!message.member.voice.channel)
            return message.channel.send(MESSAGES.MEMBER_NOT_IN_VOICE_CHANNEL);
        if (positionToSkip > serverQueue.songs.length)
            return message.channel.send(MESSAGES.OUT_OF_QUEUE_RANGE);
        serverQueue.songs = serverQueue.songs.slice(positionToSkip-1);
        serverQueue.connection.dispatcher.end();
    }

    private async stop() {
        const message = this.message;
        const serverQueue = this.serverQueue;
        if (!message.member.voice.channel)
            return message.channel.send(MESSAGES.MEMBER_NOT_IN_VOICE_CHANNEL);
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        serverQueue.playing = false;
    }

    private async clean(){
        const message = this.message;
        const serverQueue = this.serverQueue;
        if (!message.member.voice.channel)
            return message.channel.send(MESSAGES.MEMBER_NOT_IN_VOICE_CHANNEL);
        if(!serverQueue) return this.settingsService.deleteServerQueue(message.guild);
        this.serverQueue.songs = []
    }

    private async startReproduction(serverQueue: QueueItem){
        const message = this.message;
        try {
            var connection = await message.member.voice.channel.join();
            serverQueue.connection = connection
            serverQueue.playing = true;
            await this.play(serverQueue.songs[0]);
        } catch (err) {
            console.log(err);
            return message.channel.send(err);
        }
    }

    private async play(song: Song) {
        try {
            const serverQueue = this.serverQueue;
            if (!song) {
                console.log("No quedan videos")
                await sleep(5000);
                serverQueue.playing = false;
                serverQueue.voiceChannel.leave();
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

    private async showQueue(){
        const message = this.message;
        const serverQueue = this.serverQueue;
        console.log("Queue: ", serverQueue?.songs)
        if(!serverQueue){ message.channel.send(MESSAGES.NOT_QUEUE_EXIST); return}
        message.channel.send(createEmbebedMessageSongs(serverQueue.songs))
    }

    private async shuffleQueue(){
        const serverQueue = this.serverQueue;
        serverQueue.songs = shuffle<Song>(serverQueue.songs);
        this.showQueue();
    }

    private addSong(serverQueue: QueueItem, ...songs: Song[]){
        songs.map( song => serverQueue.songs.push({ ...song, requestedBy: this.message.member.user.tag }));        
        this.settingsService.saveServerQueue(serverQueue)
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
                    const sp = spotifySongs.tracks.slice(0,serverQueue.config.plimit);
                    sp.map( track => this.addSong(serverQueue, { title: `${track.title} ${track.poster}`, src: "spot" }))
                    return(spotifySongs.name)
                } else if(args.includes("youtu")) {
                    if(args.includes("list")){
                        const songs = await getSongsFromPlaylist(args);
                        this.addSong(serverQueue, ...songs.items.slice(0, this.serverQueue.config.plimit));
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

    private async createDedicatedChannel(): Promise<void>{
        const server = this.message.guild;
        if(server.channels.cache.find( ch => ch.name === this.serverQueue.config.dmtchannel)){
            this.message.reply(MESSAGES.DEDICATED_CHANNEL_EXIST);
            return;
        }
        const newChannel = await server.channels.create(this.serverQueue.config.dmtchannel, { type: 'text', reason: 'Porque si' });
        this.message.reply(MESSAGES.DEDICATE_CHANNEL_SUCCESFULL.format(newChannel))
        newChannel.send(MESSAGES.WELCOME_DEDICATED_MUSIC_CHANNEL);
        return;
    }

    public async listenDedicatedChannel(message: Message){
        if(this.checkIfContainCommand(message)){ return message.reply(MESSAGES.NOT_COMMAND_HERE)}
        await this.setMessageAndServer(message);
        this.execute(message.content);
    }

    private checkIfContainCommand(message: Message){
        const result = Object.keys(commands).find( com => message.content.toLocaleLowerCase().startsWith(commands[com]))
        console.log("ES COMANDO? : ", result != undefined)
        return result != undefined
    }

    private setSettings(request: string){
        const [ config, value] = request.split(" ");
        if(!config) return this.showSettings();
        if(!value){
            return this.message.channel.send(MESSAGES.NOT_CONFIG)
        }
        const configServer = this.serverQueue.config;
        const result = Object.keys(configServer).find( c => c.toLowerCase() === config)
        if(!result){ return this.message.channel.send(MESSAGES.NOT_CONFIG)}
        this.serverQueue.config[config] = value;
        this.message.reply(MESSAGES.COMMAND_SAVE.format(config, value))
        this.showSettings()
    }

    private showSettings(){
        this.message.channel.send(createEmbebedMessageSettings(this.serverQueue.config, SETTINGS_DESC))
    }

    private showCommands(){
        this.message.channel.send(createEmbebedMessageCommands(commands, commandsDescription));
    }
}


 
