const dialogFlow = require('dialogflow');

const dialogFlowClient = new dialogFlow.SessionsClient();
const sessionPath = dialogFlowClient.sessionPath('bot-discord-ipijxl', 'bot-discord');

function removePrefix(text) {
    return text.replace('!', '');
}

brain = async (client, message) => {
    return new Promise( async (resolve, reject) => {
        const cleanMessage = removePrefix(message.cleanContent);
        console.log("Mensaje: ", cleanMessage)
        
        const dialogflowRequest = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: cleanMessage,
                    languageCode: 'es-ES'
                }
            }
        };
            
        const responses = await dialogFlowClient.detectIntent(dialogflowRequest);
    
        console.log('Respuesta dialogflow: ', responses[0].queryResult);
        const respuesta = responses[0].queryResult.fulfillmentText;
        if(respuesta != ''){
            message.channel.send(responses[0].queryResult.fulfillmentText);
        } else{
            message.channel.send(messages.NOT_RESPONSE);
        }
        resolve()
    })
}

module.exports = { brain }