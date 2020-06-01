import { SessionsClient } from 'dialogflow';
import { messages } from './config.json';
import { v4 } from 'uuid';

export class ChatBot {    
    constructor(dialogFlowProject,discordClient){
        this.uuid = v4();
        this.discordClient = discordClient;
        this.dialogFlowClient = new SessionsClient();
        this.sessionPath = this.dialogFlowClient.sessionPath(dialogFlowProject, this.uuid );
        console.log("DialogFlow inicializado")
    }

    getResponse(message) {
        return new Promise(async (resolve, reject) => {
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
            })
            resolve()
    }

    actions(message, response){
        return new Promise( (resolve, reject) => {
            const { intent } = response.queryResult;
            if (intent) {
                if (intent.displayName === 'discord.mover') {
                    const user = this.getMention(mentions, 'users');
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

const moverUsuario = (message, user, channel) => {
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