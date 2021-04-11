import { Guild, Message } from "discord.js";
import { DEFAULT_DEDICATED_MUSIC_TEXT_CHANNEL, DEFAULT_LISTENCHANNEL, DEFAULT_PLAYLIST_LIMIT, DEFAULT_PREFIX } from "../../config";
import { RedisService } from "./redis";
import { QueueItem } from "../types/queue";

export class SettingsService {
    private queue:Map<string, QueueItem> = new Map<string, QueueItem>();;
    private redisClient: RedisService;

    constructor(redisService: RedisService){
        this.redisClient = redisService;
    }

    async getServer(message: Message): Promise<QueueItem> {
        console.log("ServerID: ", message.guild.name)
        const queue = this.queue.get(message.guild.id);
        return queue ? queue : await this.initializeServerQeue(message)
    }

    private async initializeServerQeue(message: Message): Promise<QueueItem>{
        const queueContruct : QueueItem = {
            textChannel: message.channel,
            voiceChannel: message.member.voice.channel,
            connection: null,
            songs: [],
            volume: 5,
            playing: false,
            guild: message.guild,
            config: {
                prefix: DEFAULT_PREFIX,
                lschannel: DEFAULT_LISTENCHANNEL,
                plimit: DEFAULT_PLAYLIST_LIMIT,
                dmtchannel: DEFAULT_DEDICATED_MUSIC_TEXT_CHANNEL
            }
        };
        const queueRedis = await this.loadServerQueue(message.guild);        
        if(queueRedis){
            queueContruct.songs = queueRedis.songs;
            queueContruct.config = queueRedis.config;
            queueContruct.volume = queueRedis.volume;
        }
        this.queue.set(message.guild.id, queueContruct);
        await this.saveServerQueue(queueContruct);
        return queueContruct      
    }

    async saveServerQueue(queue: QueueItem){
        this.queue.set(queue.guild.id, queue);
        const redisQueue: QueueItem = {
            ...queue,
            connection: null
        }
        await this.redisClient.setObject(queue.guild.id, redisQueue)
    }
    
    async loadServerQueue(guild: Guild){
        const server = await this.redisClient.getObject<QueueItem>(guild.id);
        return server;
    }

    async deleteServerQueue(guild: Guild){
        await this.redisClient.delete(guild.id)
    }


}