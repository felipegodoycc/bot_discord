import { SessionsClient } from 'dialogflow';
import { messages } from './config.json';

const dialogFlowClient = new SessionsClient();
const sessionPath = dialogFlowClient.sessionPath('bot-discord-ipijxl','bot-discord');

function removePrefix(text) {
    return text.replace('!', '')
}

export const brain = async (client, message) => {
    return new Promise(async (resolve, reject) => {
        const { mentions } = message
        console.log('Menciones: ', mentions.users)
        const cleanMessage = removePrefix(message.cleanContent)

        const dialogflowRequest = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: cleanMessage,
                    languageCode: 'es-ES',
                },
            },
        }

        const [response] = await dialogFlowClient.detectIntent(
            dialogflowRequest,
        )

        console.log('Respuesta dialogflow: ', response.queryResult)

        const { intent } = response.queryResult
        if (intent) {
            console.log('Intencion: ', intent)
            const respuesta = response.queryResult.fulfillmentText
            if (respuesta != '') {
                message.channel.send(response.queryResult.fulfillmentText)
            } else {
                message.channel.send(messages.NOT_RESPONSE)
            }
            if (intent.displayName === 'discord.mover') {
                const user = getMention(mentions, 'users')
                getChannelFromResponse(message, response)
                    .then((channel) => moverUsuario(message, user, channel))
                    .catch((err) => message.reply(err))
            } else if (intent.displayName === 'discord.moverme') {
                const user = message.author
                getChannelFromResponse(message, response)
                    .then((channel) => moverUsuario(message, user, channel))
                    .catch((err) => message.reply(err))
            }
            resolve()
        } else {
            message.channel.send(messages.NOT_RESPONSE)
        }
    })
}

const moverUsuario = (message, user, channel) => {
    const member = message.guild.member(user)
    // console.log(user, channel)
    if (user) {
        if (channel.type === 'voice') {
            member.voice.setChannel(
                channel.id,
                messages.MOVE_REASON.format(message.author.tag),
            )
            message.channel.send(messages.MOVE_SUCCESS)
        } else message.reply(messages.NOT_VOICE_CHANNEL)
    } else {
        message.reply(messages.NOT_USER_FIND)
    }
}

const getChannelFromResponse = (message, response) => {
    return new Promise((resolve, reject) => {
        const nameChannel = response.queryResult.parameters.fields.salaDiscord.stringValue.replace(
            'canal ',
            '',
        )
        const channel = message.guild.channels.cache.find(
            (channel) => channel.name === nameChannel.trim(),
        )
        if (!channel) reject(messages.NOT_FOUND_CHANNEL)
        else resolve(channel)
    })
}

const getMention = (mentions, type) => {
    const filters = mentions[type]
    return filters.size > 0 ? filters.first() : undefined
}
