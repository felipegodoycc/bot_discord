const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, messages} = require('./config.json');

const ytdl = require("ytdl-core");
const queue = new Map();

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

client.on('message', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content === `${prefix}ping`) {
        message.channel.send("pong")
    } else if(message.content.startsWith(`${prefix}mueve`)){
        const user = message.mentions.users.first();
        if(user){
            const member = message.guild.member(user);
            const nameChannel = message.content.split("!to")[1];
            const channel = member.guild.channels.cache.find( channel => channel.name === nameChannel.trim())
            if(channel){
                if(channel.type === 'voice') {
                    member.voice.setChannel(channel.id, messages.MOVE_REASON.format(message.author.tag));
                    message.channel.send(messages.MOVE_SUCCESS);
                }
                else message.reply(messages.NOT_VOICE_CHANNEL)
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
        message.channel.send(messages.INVALID_COMMAND)
    }
})

async function execute(message, serverQueue) {
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
  
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
    if (!serverQueue)
      return message.channel.send(messages.EMPTY_QUEUE);
    serverQueue.connection.dispatcher.end();
  }
  
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(messages.MEMBER_NOT_IN_VOICE_CHANNEL);
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(messages.PLAY_SONG.format(song.title));
  }
  
