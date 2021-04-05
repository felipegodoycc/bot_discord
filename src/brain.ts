import { SessionsClient } from '@google-cloud/dialogflow';
import { messages } from './config';
import { v4 } from 'uuid';
import { Message } from 'discord.js';

export class ChatBot {
    private uuid: string;
    private dialogFlowClient: SessionsClient;
    private sessionPath:string;

    constructor(dialogFlowProject){
        this.uuid = v4();
        this.dialogFlowClient = new SessionsClient();
        this.sessionPath = this.dialogFlowClient.projectAgentSessionPath(dialogFlowProject, this.uuid );
        console.log("DialogFlow inicializado")
    }

    getResponse(message): Promise<void> {
        return new Promise(async (resolve) => {
            const cleanMessage = this.removePrefix(message.cleanContent)
            
            const dialogflowRequest = {
                session: this.sessionPath,
                queryInput: {
                    text: {
                        text: cleanMessage,
                        languageCode: 'es-ES',
                    }
                }
            };
            
            const [response] = await this.dialogFlowClient.detectIntent(dialogflowRequest);
            const respuesta = response.queryResult.fulfillmentText;

            message.channel.send( respuesta ? respuesta : messages.NOT_RESPONSE);
            
            this.actions(message, response)
                .then( msg => message.channel.send(msg))
                .catch( error => message.channel.send(error))
            resolve()
        })
    }

    actions(message: Message, response){
        return new Promise( (resolve, reject) => {
            const { intent } = response.queryResult;
            if (intent) {
                if (intent.displayName === 'discord.mover') {
                    const user = this.getMention(message.mentions, 'users');
                    this.getChannelFromResponse(message, response)
                        .then((channel) => moverUsuario(message, user, channel))
                        .then( msg => resolve(msg))
                        .catch( err => reject(err))
                } else if (intent.displayName === 'discord.moverme') {
                    const user = message.author;
                    this.getChannelFromResponse(message, response)
                        .then((channel) => moverUsuario(message, user, channel))
                        .then( msg => resolve(msg))
                        .catch( err => reject(err))
                } else {
                    reject(messages.NOT_INTENT_EXIST)
                }
            } else {
                reject(messages.NOT_RESPONSE)
            }
        })
    }
    
            
    getChannelFromResponse(message, response) {
        return new Promise((resolve, reject) => {
            const nameChannel = response.queryResult.parameters.fields.salaDiscord.stringValue.replace('canal ','');
            const channel = message.guild.channels.cache.find( (channel) => channel.name === nameChannel.trim() );    
            if (!channel) reject(messages.NOT_FOUND_CHANNEL)
            else resolve(channel)
        })
    }
                    
    getMention(mentions, type) {
        const filters = mentions[type]
        return filters.size > 0 ? filters.first() : undefined
    }
                    
    removePrefix(text) {
        return text.replace('!', '')
    }   

}

const moverUsuario = (message: Message, user, channel) => {
    return new Promise( (resolve, reject) => {
        const member = message.guild.member(user)
        // console.log(user, channel)
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