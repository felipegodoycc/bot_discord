const Discord = require('discord.js');
const client = new Discord.Client();

client.login(process.env.TOKEN_DISCORD_BOT);

client.on('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`)
})

client.on('message', (message) => {
    console.log("De : ", message.author.tag , ", mensaje: ", message.content)
    if(message.content === "ping") message.channel.send("pong")
    if(message.content.startsWith("!mueve")){
        const user = message.mentions.users.first();
        if(user){
            const member = message.guild.member(user);
            const nameChannel = message.content.split("!to")[1];
            const channel = member.guild.channels.cache.find( channel => channel.name === nameChannel.trim())
            if(channel){
                if(channel.type === 'voice') {
                    member.voice.setChannel(channel.id, `Me lo pidio ${message.author.tag}`);
                    message.channel.send("Moviendo al pete");
                }
                else message.reply("El canal no es de voz")
            } else {
                message.reply("No pude encontrar el canal")
            }
        }
    }
})