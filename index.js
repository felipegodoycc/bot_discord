const Discord = require('discord.js');
const client = new Discord.Client();
const dialogFlow = require('dialogflow')

const dialogFlowClient = new dialogFlow.SessionsClient();
const sessionPath = dialogFlowClient.sessionPath('bot-discord-ipijxl', 'bot-discord');

client.login(process.env.TOKEN_DISCORD_BOT);

client.on('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`)
})

client.on('message', async(message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content === `${prefix}ping`) {
        message.channel.send("pong")
    } else if (message.content.startsWith(`${prefix}mueve`)) {
        const user = message.mentions.users.first();
        if (user) {
            const member = message.guild.member(user);
            console.log(member);
            const nameChannel = message.content.split("!to")[1];
            const channel = member.guild.channels.cache.find( channel => channel.name === nameChannel.trim())
            if(channel){
                if(channel.type === 'voice') {
                    member.voice.setChannel(channel.id, messages.MOVE_REASON.format(message.author.tag));
                    message.channel.send(messages.MOVE_SUCCESS);
                } else message.reply(messages.NOT_VOICE_CHANNEL)
            } else {
                message.reply(messages.NOT_FOUND_CHANNEL)
            }
        }
    } else if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
        return;
    } else {
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
        
          dialogFlowClient.detectIntent(dialogflowRequest).then(responses => {
            message.channel.send(responses[0].queryResult.fulfillmentText);
          });        
    }

})

async function execute(message, serverQueue) {
    // /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(messages.NOT_VOICE_CHANNEL);
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(messages.NOT_VOICE_PERMISSION);
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(messages.ADD_SONG.format(song.title));
    }
}

function remove(username, text) {
    return text.replace('@' + username + ' ', '').replace('!' + ' ', '');
  }
