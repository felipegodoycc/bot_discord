import { Client, Message } from "discord.js";
import { prefix, messages, listenChannel } from "./config";
import { MusicBot } from "./music";
import { ChatBot } from "./brain";

const client: Client = new Client();
const chatBot = new ChatBot(process.env.DIALOG_FLOW_PROJECT);
const musicBot = new MusicBot();

declare global {
    interface String {
      format(...items: any[]): string;
    }
}

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
};

client.login(process.env.TOKEN_DISCORD_BOT);

client.on("ready", () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on("message", async (message: Message) => {
    try {
        if (message.author.bot) return;
        if (!message.content.startsWith(prefix)) return;
        if (message.channel.id != listenChannel) return;

        if (message.content.startsWith(`${prefix}play`)) {
            musicBot.execute(message);
            return;
        } else if (message.content.startsWith(`${prefix}skip`)) {
            musicBot.skip(message);
            return;
        } else if (message.content.startsWith(`${prefix}stop`)) {
            musicBot.stop(message);
            return;
        } else {
            await chatBot.getResponse(message);
        }
    } catch (error) {
        console.log("Error: ", error);
        message.channel.send(messages.ERROR);
    }
});
