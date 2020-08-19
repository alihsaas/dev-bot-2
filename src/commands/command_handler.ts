import { Message } from "discord.js";
import { Command } from "./command_base";
import { CommandContext } from "../models/command_context";
import { reactor } from "../models/react";
import { getDirectories, getFiles } from "../models/utility";
import { join } from "path";
import { HelpCommand } from "./utility/help";

/** Handler for bot commands issued by users. */

export class CommandHandler {
	private commands: Command[];

	private readonly prefix: string;

	constructor(prefix: string) {
		const commandTypes = getDirectories(join(__dirname));
		const commandClasses : any[] = commandTypes
			.flatMap(directory => getFiles(
				join(__dirname, directory.name)
				)
				.filter(file => !file.name.startsWith(`help`))
				.map(file => Object.values(
					require(
						join(__dirname, directory.name, file.name)
					)
				)[0]
			)
		);
		this.commands = commandClasses.map(commandClass => new commandClass());
		this.commands.push(new HelpCommand(this.commands));
		this.prefix = prefix;
	}

	/** Executes user commands contained in a message if appropriate. */
	async handleMessage(message: Message): Promise<void> {
		if (message.author.bot || !this.isCommand(message)) {
			return;
		}

		const commandContext = new CommandContext(message, this.prefix);

		const allowedCommands = this.commands.filter(command => command.hasPermissionToRun(commandContext));
		const matchedCommand = this.commands.find(command => command.commandNames.includes(commandContext.parsedCommandName));

		if (!matchedCommand) {
			await message.reply(`I don't recognize that command. Try !help.`);
			await reactor.failure(message);
		} else if (!allowedCommands.includes(matchedCommand)) {
			await message.reply(`you aren't allowed to use that command. Try !help.`);
			await reactor.failure(message);
		} else {
			await matchedCommand.run(commandContext).then(() => {
				reactor.success(message);
			}).catch((err) => {
				console.log(err)
				reactor.failure(message);
			});
		}
	}

	private isCommand(message: Message): boolean {
		return message.content.startsWith(this.prefix);
	}
}