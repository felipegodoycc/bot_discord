import { Client, Message, PresenceData } from "discord.js";
import { MESSAGES} from "./config";
import { MusicBot } from "./music/music";
import { ChatBot } from "./dialogflow/brain";
import dotenv from 'dotenv';
import { getChannelName } from "./shared/utlis/discord-utils";
import './shared/types/string.extend';
dotenv.config();
import services from "./shared/services";

const client: Client = new Client();
const chatBot = new ChatBot(services);

client.login(process.env.TOKEN_DISCORD_BOT);


client.on("ready", () => {
    const botActivity: PresenceData = {
        activity: {
            name: process.env.BOT_STATUS
        },
        status: "online"
    }
    client.user.setPresence(botActivity)
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on("message", async (message: Message) => {
    try {
        const { config } = await services.settingsService.getServer(message);
        if (message.author.bot || getChannelName(message) != config.lschannel) return;
        else if (getChannelName(message) === config.dmtchannel) new MusicBot(services).listenDedicatedChannel(message)
        else if (message.content.startsWith(`${config.prefix}music`) ) new MusicBot(services).executeCommand(message);
        else chatBot.getResponse(message);
    } catch (error) {
        console.log("Error MAIN: ", error);
        message.channel.send(MESSAGES.ERROR);
    }
});

client.on("voiceStateUpdate", (_oldVoiceState,newVoiceState) => { // Listeing to the voiceStateUpdate event
    if (newVoiceState.channel && newVoiceState.channel.name != 'AFK' && newVoiceState.channel.members.size <2 && newVoiceState.channel.permissionsLocked) {
        newVoiceState.guild.systemChannel.send(MESSAGES.WELCOME_VOICE_CHAT.format(newVoiceState.member.user,newVoiceState.channel.name));
    }
});

