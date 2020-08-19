import { Client } from "discord.js";
import { CommandHandler } from "./commands/command_handler";

const client = new Client();
const commandHandler = new CommandHandler(process.env.PREFIX);

client.on(`ready`, () => console.log(`Logged in as ${client.user.tag}`));

client.on(`message`, (message) => {
	commandHandler.handleMessage(message);
});

client.login(process.env.TOKEN);