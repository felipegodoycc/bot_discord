import { google } from "@google-cloud/dialogflow/build/protos/protos";
import { Channel, GuildChannel, Message, MessageMentions, UserResolvable } from "discord.js"
import { MESSAGES } from "../../config";

export function getChannelInfo(message: Message): GuildChannel {
    const idChannel = message.channel.id
    const channel: GuildChannel = message.guild.channels.cache.find( (channel) => channel.id === idChannel );
    return channel; 
}

export function getChannelName(message: Message): String {
    const channel = getChannelInfo(message);
    console.log("CHANNEL NAME: ", channel.name)
    return channel.name;
}

export function moverUsuario(message: Message, user: UserResolvable, channel: Channel): Promise<string> {
    return new Promise( (resolve, reject) => {
        const member = message.guild.member(user)
        if (user) {
            if (channel.type === 'voice') {
                member.voice.setChannel(channel.id, MESSAGES.MOVE_REASON.format(message.author.tag))
                resolve(MESSAGES.MOVE_SUCCESS)
            } else {
                reject(MESSAGES.NOT_VOICE_CHANNEL)
            }
        } else {
            reject(MESSAGES.NOT_USER_FIND)
        }
    })
}

export function getChannelFromResponse(message: Message, response: google.cloud.dialogflow.v2.IDetectIntentResponse ) : Promise<Channel> {
    return new Promise((resolve, reject) => {
        const nameChannel = response.queryResult.parameters.fields.salaDiscord.stringValue.replace('canal ','');
        console.log("NAME CHANNEL: ", nameChannel)
        const channel = message.guild.channels.cache.find( (channel) => channel.name.toLowerCase() === nameChannel.trim().toLowerCase() );    
        if (!channel) reject(MESSAGES.NOT_FOUND_CHANNEL)
        else resolve(channel)
    })
}
                
export function getMention(mentions: MessageMentions, type: string) {
    const filters = mentions[type]
    return filters.size > 0 ? filters.first() : undefined
}