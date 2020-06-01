import "@babel/polyfill";
import { Client } from "discord.js";
import { prefix, messages, listenChannel } from "./config.json";
import { execute, skip, stop, initMusicModule } from "./music";
import { ChatBot } from "./brain";

const client = new Client();
const chatBot = new ChatBot(process.env.DIALOG_FLOW_PROJECT, client);

String.prototype.format = function () {
    let a = this;
    for (let k in arguments) {
        a = a.replace(`{${k}}`, arguments[k]);
    }
    return a;
};

client.login(process.env.TOKEN_DISCORD_BOT);

client.on("ready", () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on("message", async (message) => {
    try {
        if (message.author.bot) return;
        if (!message.content.startsWith(prefix)) return;
        if (message.channel.name != listenChannel) return;

        if (message.content.startsWith(`${prefix}play`)) {
            initMusicModule(message);
            execute(message);
            return;
        } else if (message.content.startsWith(`${prefix}skip`)) {
            skip(message);
            return;
        } else if (message.content.startsWith(`${prefix}stop`)) {
            stop(message);
            return;
        } else {
            await chatBot.getResponse(message);
        }
    } catch (error) {
        console.log("Error: ", error);
        message.channel.send(messages.ERROR);
    }
});
