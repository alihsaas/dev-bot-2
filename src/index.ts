import { Client } from "discord.js";
import { CommandHandler } from "./commands/command_handler";
import  express from "express";
import  keepalive from "express-glitch-keepalive";


const client = new Client();
const commandHandler = new CommandHandler(process.env.PREFIX);
const app = express();

app.use(keepalive);

app.get("/", (req, res) => {
  res.json("This bot should be online! Uptimerobot will keep it alive");
});
app.get("/", (request, response) => {
  response.sendStatus(200);
});
app.listen(process.env.PORT);


client.on(`ready`, () => console.log(`Logged in as ${client.user.tag}`));

client.on(`message`, (message) => {
	commandHandler.handleMessage(message);
});

client.login(process.env.TOKEN);