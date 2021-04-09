import { SessionsClient } from '@google-cloud/dialogflow';
import { MESSAGES } from '../config';
import { v4 } from 'uuid';
import { Message } from 'discord.js';
import { google } from '@google-cloud/dialogflow/build/protos/protos';
import { getChannelFromResponse, getMention, moverUsuario } from '../discord/discord-utils';
import '../types/string.extend';

export class ChatBot {
    private uuid: string;
    private dialogFlowClient: SessionsClient;
    private sessionPath:string;

    constructor(){
        this.uuid = v4();
        this.dialogFlowClient = new SessionsClient();
        this.sessionPath = this.dialogFlowClient.projectAgentSessionPath(process.env.DIALOG_FLOW_PROJECT, this.uuid );
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
                }
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
            const { intent } = response.queryResult;
            const respuesta = response.queryResult.fulfillmentText;

            if (intent) {
                if (intent.displayName === 'discord.mover') {
                    const user = getMention(message.mentions, 'users');
                    const channel = await getChannelFromResponse(message, response)
                    const msg = await moverUsuario(message, user, channel)
                    return resolve(msg)
                } else if (intent.displayName === 'discord.moverme') {
                    const user = message.author;
                    const channel = await getChannelFromResponse(message, response)
                    const msg = await moverUsuario(message, user, channel)
                    return resolve(msg)
                } else {
                    return reject(respuesta ? respuesta : MESSAGES.NOT_RESPONSE)
                }
            } else {
                return reject(MESSAGES.NOT_INTENT_EXIST)
            }
        })
    }
                    
    removePrefix(text: string) {
        return text.replace('!', '')
    }   

}

