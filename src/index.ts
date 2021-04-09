import {  Client, Message } from "discord.js";
import {  MESSAGES, LISTENCHANNEL, PREFIX, DEDICATED_MUSIC_TEXT_CHANNEL } from "./config";
import { MusicBot } from "./music/music";
import { ChatBot } from "./dialogflow/brain";
import dotenv from 'dotenv';
import { getChannelName } from "./discord/discord-utils";
import './types/string.extend';

dotenv.config();
const client: Client = new Client();
const chatBot = new ChatBot();
const musicBot = new MusicBot();

client.login(process.env.TOKEN_DISCORD_BOT);


client.on("ready", () => {
    client.user.setPresence({ activity: { name: "con tu mamita", type: "PLAYING"}, status: "dnd"})
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on("message", async (message: Message) => {
    try {
        if (message.author.bot) return;
        else if (getChannelName(message) === DEDICATED_MUSIC_TEXT_CHANNEL) musicBot.listenDedicatedChannel(message)
        else if ( !message.content.startsWith(PREFIX) || getChannelName(message) != LISTENCHANNEL) return;
        else if ( message.content.startsWith(`${PREFIX}music`) ) musicBot.executeCommand(message);
        else await chatBot.getResponse(message);
    } catch (error) {
        console.log("Error: ", error);
        message.channel.send(MESSAGES.ERROR);
    }
});

client.on("voiceStateUpdate", (_oldVoiceState,newVoiceState) => { // Listeing to the voiceStateUpdate event
    if (newVoiceState.channel && newVoiceState.channel.name != 'AFK' && newVoiceState.channel.members.size <2 && newVoiceState.channel.permissionsLocked) {
        newVoiceState.guild.systemChannel.send(MESSAGES.WELCOME_VOICE_CHAT.format(newVoiceState.member.user,newVoiceState.channel.name));
    }
});

