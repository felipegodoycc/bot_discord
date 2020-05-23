const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, messages, listenChannel } = require('./config.json')
const { execute, skip, stop } = require('./music');
const { brain } = require('./brain');


String.prototype.format = function() {
    a = this;
    for (k in arguments) {
        a = a.replace("{" + k + "}", arguments[k])
    }
    return a
}

client.login(process.env.TOKEN_DISCORD_BOT);

client.on('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`)
})

client.on('message', async(message) => {
    try {
        if(message.author.bot) return;
        if(!message.content.startsWith(prefix)) return;
        if(message.channel.name != listenChannel) return;
    
        const serverQueue = queue.get(message.guild.id);
        
        if (message.content.startsWith(`${prefix}play`)) {
            execute(message, serverQueue);
            return;
        } else if (message.content.startsWith(`${prefix}skip`)) {
            skip(message, serverQueue);
            return;
        } else if (message.content.startsWith(`${prefix}stop`)) {
            stop(message, serverQueue);
            return;
        } else {
            await brain(client, message);
        }
    } catch (error) {
        console.log("Error: ", error);
        message.channel.send(messages.ERROR);         
    }
})




