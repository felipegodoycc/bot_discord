import { google } from "@google-cloud/dialogflow/build/protos/protos";
import { Channel, Guild, GuildChannel, Message, MessageMentions, UserResolvable } from "discord.js"
import { generalChannel, messages } from "../config";

export function getChannelInfo(message: Message): GuildChannel {
    const idChannel = message.channel.id
    const channel: GuildChannel = message.guild.channels.cache.find( (channel) => channel.id === idChannel );
    return channel; 
}

export function getChannelName(message: Message): String {
    const channel = getChannelInfo(message);
    return channel.name;
}

export function moverUsuario(message: Message, user: UserResolvable, channel: Channel): Promise<string> {
    return new Promise( (resolve, reject) => {
        const member = message.guild.member(user)
        if (user) {
            if (channel.type === 'voice') {
                member.voice.setChannel(channel.id, messages.MOVE_REASON.format(message.author.tag))
                resolve(messages.MOVE_SUCCESS)
            } else {
                reject(messages.NOT_VOICE_CHANNEL)
            }
        } else {
            reject(messages.NOT_USER_FIND)
        }
    })
}

export function getChannelFromResponse(message: Message, response: google.cloud.dialogflow.v2.IDetectIntentResponse ) : Promise<Channel> {
    return new Promise((resolve, reject) => {
        const nameChannel = response.queryResult.parameters.fields.salaDiscord.stringValue.replace('canal ','');
        const channel = message.guild.channels.cache.find( (channel: { name: any; }) => channel.name === nameChannel.trim() );    
        if (!channel) reject(messages.NOT_FOUND_CHANNEL)
        else resolve(channel)
    })
}
                
export function getMention(mentions: MessageMentions, type: string) {
    const filters = mentions[type]
    return filters.size > 0 ? filters.first() : undefined
}

export function getDefaultChannel(guild: Guild){
    return guild.channels.cache.filter( ch => ch.type === 'text').find( ch => ch.name === generalChannel)
  }