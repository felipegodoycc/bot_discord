import "@babel/polyfill";
import { Client } from "discord.js";
import { prefix, messages, listenChannel } from "./config.json";
import { execute, skip, stop, initMusicModule } from "./music";
import { brain } from "./brain"

const client = new Client();

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
        }
        if (message.content.startsWith(`${prefix}skip`)) {
            skip(message);
            return;
        }
        if (message.content.startsWith(`${prefix}stop`)) {
            stop(message);
            return;
        }
        await brain(client, message);
    } catch (error) {
        console.log("Error: ", error);
        message.channel.send(messages.ERROR);
    }
});
