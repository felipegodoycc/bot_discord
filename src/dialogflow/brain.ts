import { SessionsClient } from '@google-cloud/dialogflow';
import { MESSAGES } from '../config';
import { v4 } from 'uuid';
import { Message } from 'discord.js';
import { google } from '@google-cloud/dialogflow/build/protos/protos';
import { getChannelFromResponse, getMention, moverUsuario } from '../shared/utlis/discord-utils';
import '../shared/types/string.extend';
import { MusicBot } from '../music/music';

export class ChatBot {
    private uuid: string;
    private dialogFlowClient: SessionsClient;
    private sessionPath:string;
    private services = null;

    constructor(services){
        this.uuid = v4();
        this.dialogFlowClient = new SessionsClient();
        this.sessionPath = this.dialogFlowClient.projectAgentSessionPath(process.env.DIALOG_FLOW_PROJECT, this.uuid );
        this.services = services;
        console.log("DialogFlow inicializado")
    }

    getResponse(message: Message): Promise<void> {
        return new Promise(async (resolve) => {
            const cleanMessage = this.removePrefix(message.cleanContent)
            
            const dialogflowRequest = {
                session: this.sessionPath,
                queryInput: {
                    text: {
                        text: cleanMessage,
                        languageCode: 'es-ES',
                    }
                },

            };
            
            const [response] = await this.dialogFlowClient.detectIntent(dialogflowRequest);
    
            this.actions(message, response)
                .then( msg => message.channel.send(msg))
                .catch( error => message.channel.send(error))
            return resolve()
        })
    }

    actions(message: Message, response: google.cloud.dialogflow.v2.IDetectIntentResponse){
        return new Promise( async (resolve, reject) => {
            const { intent, parameters } = response.queryResult;
            const respuesta = response.queryResult.fulfillmentText;
            if (intent) {
                const [category, command] = intent.displayName.split('.');
                if(category === 'discord'){
                    if (command === 'mover') {
                        const user = getMention(message.mentions, 'users');
                        const channel = await getChannelFromResponse(message, response)
                        const msg = await moverUsuario(message, user, channel)
                        return resolve(msg)
                    } else if (command === 'moverme') {
                        const user = message.author;
                        const channel = await getChannelFromResponse(message, response)
                        const msg = await moverUsuario(message, user, channel)
                        return resolve(msg)
                    }
                }
                else if( category === 'music'){
                    message.channel.send(MESSAGES.CALLING_MUSIC_BOT)
                    try {
                        const bot = new MusicBot(this.services);
                        const request = this.getParametersFields(parameters)
                        console.log("COMANDO: ", command, " REQUESTED: ", request)
                        bot.executeCommand(message, command, request, true)                                         
                    } catch (error) {
                        return reject(MESSAGES.FAIL_MUSIC_BOT)                        
                    }
                }
                else {
                    return resolve(respuesta ? respuesta : MESSAGES.NOT_RESPONSE)
                }
            } else {
                return reject(MESSAGES.NOT_INTENT_EXIST)
            }
        })
    }
                    
    removePrefix(text: string) {
        return text.replace('!', '')
    }

    getParametersFields(parameters: google.protobuf.IStruct){
        let result = [];
        const fields = parameters.fields;
        Object.keys(fields).map( f => {
            if(f === 'music_commands') return
            const field = fields[f];
            if(field.stringValue) result.push(field.stringValue);
            else if(field.listValue){
                field.listValue.values.map( value => result.push(value.stringValue) )
            }
        })
        return result.join(" ")
    }

}

