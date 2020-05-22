const dialogFlow = require('dialogflow');

const dialogFlowClient = new dialogFlow.SessionsClient();
const sessionPath = dialogFlowClient.sessionPath('bot-discord-ipijxl', 'bot-discord');

function remove(username, text) {
    return text.replace('@' + username + ' ', '').replace('!' + ' ', '');
}

brain = (client, message) => {
    const cleanMessage = remove(client.user.username, message.cleanContent);
    
    const dialogflowRequest = {
        session: sessionPath,
        queryInput: {
            text: {
            text: message,
            languageCode: 'es-ES'
            }
        }
        };
    
    return dialogFlowClient.detectIntent(dialogflowRequest)
}

module.exports = { brain }