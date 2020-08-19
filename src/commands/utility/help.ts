import { MessageEmbed } from "discord.js"
import { Command } from "../command_base";
import { CommandContext } from "../../models/command_context";
import { getDirByFile } from "../../models/utility";
import { join } from "path";

export class HelpCommand implements Command {
  readonly commandNames = ["help", "halp", "hlep"];

  private commands: Command[];

  constructor(commands: Command[]) {
    this.commands = commands;
  }

  async run(commandContext: CommandContext): Promise<void> {
    const allowedCommands = this.commands.filter(command => command.hasPermissionToRun(commandContext));

    if (commandContext.args.length === 0) {
      // No command specified, give the user a list of all commands they can use.
      const commandNames = allowedCommands.map(command => command.commandNames[0]);
      await commandContext.originalMessage.reply(this.listCommands(commandNames));
      return;
    }

    const matchedCommand = this.commands.find(command => command.commandNames.includes(commandContext.args[0]));
    if (!matchedCommand) {
      await commandContext.originalMessage.reply(`I don't know about that command :(. Try ${commandContext.commandPrefix}help to find all commands you can use.`);
      return Promise.reject(`Unrecognized command`);
    } else if (allowedCommands.includes(matchedCommand)) {
      await commandContext.originalMessage.reply(this.buildHelpMessageForCommand(matchedCommand, commandContext));
    }
  }

  private listCommands(commandNames : string[]) {
    const messageEmbed = new MessageEmbed();
    const commandTypes: {
      [key: string]: string[];
    } = {};

    for (const commandName of commandNames) {
      const commandType = getDirByFile(join(__dirname, ".."), commandName+".js").replace(/^\w/, (r) => r.toUpperCase());
      commandTypes[commandType] = commandTypes[commandType] ? commandTypes[commandType] : [];
      commandTypes[commandType].push(`\`${commandName}\``);
    }

    messageEmbed.setTitle("Commands");
    messageEmbed.setDescription("The following is a list of bot commands organized into their appropriate category");
    messageEmbed.setColor("#00BCC8");
    for (const type of Object.keys(commandTypes)) {
      messageEmbed.addField(type, commandTypes[type].join(`, `));
    }
    return messageEmbed;
  }
  private buildHelpMessageForCommand(command: Command, context: CommandContext): string {
    return `${command.getHelpMessage(context.commandPrefix)}\nCommand aliases: \`${command.commandNames.join(", ")}\``;
  }

  hasPermissionToRun(commandContext: CommandContext): boolean {
    return true;
  }

  getHelpMessage(commandPrefix: string) {
    return "I think you already know how to use this command...";
  }
}