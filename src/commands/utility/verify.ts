import fetch from "node-fetch";
import endpoints from "../../models/endpoints";
import safe from "../../models/safe_words";
import DataBase from "../../models/database";
import { MessageAttachment,
  MessageEmbed,
  User,
  MessageReaction } from "discord.js";
import { randomInt } from "../../models/utility";
import { createCanvas, loadImage } from "canvas";
import { load } from "cheerio";
import { CommandContext } from "../../models/command_context";
import { Command } from "../command_base";

export class Verify implements Command {
  commandNames = ["verify"];
  getHelpMessage(commandPrefix: string): string {
    return `Use ${commandPrefix}verify to link your account to your Ruby Realms account.`;
  }

  async run(parsedUserCommand: CommandContext): Promise<void> {
    const originalMessage = parsedUserCommand.originalMessage;
    const authorId = parsedUserCommand.originalMessage.author.id;
    if (originalMessage.channel.id !== `602041679683387392` && originalMessage.channel.id !== `605771317874130955` ) {
      throw new Error(`Wrong Channel`);
    }

    const [previousDescribtion, accountId] = await this.grabDescribtion(parsedUserCommand.args[0]);
    if (!previousDescribtion) {
      await originalMessage.reply(`invalid user provided.`);
      throw new Error("Invalid User Provided");
    }

    const accountData = await DataBase.getDataByAuthorId(authorId)
    if (Object.entries(accountData).length !== 0) {
      await originalMessage.reply(`You already linked to an account: ${accountData[0].accountName}`);
      throw new Error(`You are already Verified`);
    }

    const row = await DataBase.getDataByAccountId(accountId as number)
    console.log(row);
    if (Object.entries(row).length !== 0 ) {
      await originalMessage.reply(`this account is already linked to another member's account.`);
      throw new Error(`Account already Verified`);
    }

    const code = this.createCode();
    const filter = (reaction: MessageReaction, user: User) =>
      reaction.emoji.name === "✅" && user.id === authorId;

    originalMessage.reply(this.createVerificationEmbed());
    originalMessage.channel.send(`\`${code}\``);
    await originalMessage.channel.send(await this.createCanvas(code))
      .then( message => {
        message.react("✅");
        const collector = message.createReactionCollector(filter, {time: 15*(6*10**4)});

        collector.on("collect", async () => {
          const [describtion] = await this.grabDescribtion(parsedUserCommand.args[0]);
          if ((describtion as string).includes(code)) {
            originalMessage.member.roles.add(`601982432723337238`)
              .catch( () => console.log(`Failed to add community member.`));
            originalMessage.member.roles.remove(`605776605628989480`)
              .catch( () => console.log(`Failed to remove not verified.`));
            await DataBase.setData(authorId, accountId, parsedUserCommand.args[0]);
            message.author.send("Verified")
              .catch( () => console.log(`Failed to DM member: ${originalMessage.author.tag}`));
          } else {
            message.channel.send("Stinky");
          }
          collector.stop(`collected`);
        })
        collector.on("end", async (_, reason) => {
          if (reason === "time") {
            message.edit("Out of Time.");
          }
        })
      })
  }
  /*
  private createCode(length: number = 10 ) {
    return [...Array(length).keys()].map(() => String.fromCharCode(randomInt(1, 122))).join("");
  }
  */

  private createCode(length: number = 10): string {
    return [...Array(length).keys()]
      .map(() => safe[randomInt(safe.length - 1)])
      .join(" ");
  }

  private createVerificationEmbed() {
    return new MessageEmbed()
      .setTitle(`Verification`)
      .setDescription(`Place the code provided in your account's Bio, you can change your Bio on https://rubyrealms.com/account/settings.`)
      .setFooter(`React with ✅ when done.`);
  }

  private async createCanvas(code: string) {
    const canvas = createCanvas(508, 309);;
    const context = canvas.getContext(`2d`);

    const image = await loadImage(endpoints.settingsPage)
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    context.font = "14px sans-serif";
    context.fillStyle = `#FFFFFF`;
    context.fillText(code.replace(/(.{40})..+/, "$1..."), 45, 105);
    return new MessageAttachment(canvas.toBuffer(), `verification.png`);
  }

  private async grabDescribtion(accountName: string) {
    const response = await fetch(endpoints.userProfile(accountName));
    const body = await response.text();
    const $ = load(body);
    return [$($(`.margin-none`)[2]).text(), Number.parseInt($(`#profile-user-id`).val(), 10)]
  }

  hasPermissionToRun(parsedUserCommand: CommandContext): boolean {
    return parsedUserCommand.originalMessage.member.roles.cache.every( role => role.id !== "601982432723337238" );
  }
}