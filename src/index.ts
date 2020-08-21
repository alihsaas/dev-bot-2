import { Client } from "discord.js";
import { CommandHandler } from "./commands/command_handler";
import crypto from "crypto";
import express from "express";
import cmd from "node-cmd";
​
const client = new Client();
const commandHandler = new CommandHandler(process.env.PREFIX);
​
const app = express();
app.get("/", (request, response) => {
	console.log(Date.now() + " Ping Received");
	response.sendStatus(200);
});
​
app.post('/git', (req, res) => {
	const hmac = crypto .createHmac("sha1", process.env.SECRET);
	const sig  = "sha1=" + hmac.update(JSON.stringify(req.body)).digest("hex");
	​
	if (req.headers['x-github-event'] === "push" &&
		sig === req.headers['x-hub-signature']) {
			cmd.run('chmod 777 git.sh');
			cmd.get('./git.sh', (err, data) => {
				if (data) console.log(data);
				if (err) console.log(err);
			});
			cmd.run('refresh');
			​
			const commits = req.body.head_commit.message.split("\n").length === 1 ?
			req.body.head_commit.message :
			req.body.head_commit.message.split("\n").map((el, i) => i !== 0 ? "                       " + el : el).join("\n");
			console.log(`> [GIT] Updated with origin/master\n` +
				`        Latest commit: ${commits}`);
			​
			return res.sendStatus(200);
		}
	});
​
app.listen(process.env.PORT);
​
​
client.on(`ready`, () => console.log(`Logged in as ${client.user.tag}`));
​
client.on(`message`, (message) => {
	commandHandler.handleMessage(message);
});
​
client.login(process.env.TOKEN);
​
​
