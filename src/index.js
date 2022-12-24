require("dotenv").config();

const { Client, GatewayIntentBits, Partials, TextChannel, MessageType } = require("discord.js");
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

const ZIG_GUILD = "605571803288698900";
const ROOT_LOG = "973702233613008896";
const ZIG_HELP = "1019652020308824145";
const ANSWERED_TAG = "1055294505412198430";
const WHEEL_ROLE = "761628228409884672";

/**
 * @type {TextChannel}
 */
let rootLogChannel;

client.on("ready", async () => {
	console.log(`Logged in as ${client.user.tag}!`);

    rootLogChannel = await (await (await client.guilds.fetch()).get(ZIG_GUILD).fetch()).channels.fetch(ROOT_LOG);
});

client.on("messageReactionAdd", async reaction => {
	if (reaction.emoji.name === "zighelp") {
        const message = await reaction.message.fetch();
        const users = await reaction.users.fetch();
        const guild = await message.guild.fetch();

        const wheel_role = await guild.roles.fetch(WHEEL_ROLE);
        const wheel = users.find(_ => wheel_role.members.has(_.id));
        
        if (wheel) {
            await rootLogChannel.send(`<@${wheel.id}> just referred <@${message.author.id}> to <#${ZIG_HELP}>!`);
            await message.delete();
            message.author.createDM(true).then(async dm => {
                dm.send("Please use <#1019652020308824145> to ask Zig-related questions!");
            }).catch(() => {
                message.channel.send(`<@${message.author.id}>, please use <#1019652020308824145> to ask Zig-related questions!`);
            });
        }
    } else if (reaction.emoji.name === "✅") {
        const message = await reaction.message.fetch();
        const channel = await message.channel.fetch();
        const guild = await message.guild.fetch();

        if (!channel.isThread()) return;
        if (channel.parentId !== ZIG_HELP) return;

        const wheel_role = await guild.roles.fetch(WHEEL_ROLE);
        const users = await reaction.users.fetch();
        const author = users.get(message.author.id);
        const wheel = users.find(_ => wheel_role.members.has(_.id));

        if (author || wheel) {
            await channel.setAppliedTags([...new Set([...channel.appliedTags, ANSWERED_TAG])], "Author marked post as answered");
            channel.setArchived(true);
        }
    }
});

client.on("messageReactionRemove", async reaction => {
    if (reaction.emoji.name === "✅") {
        const message = await reaction.message.fetch();
        const channel = await message.channel.fetch();

        if (!channel.isThread()) return;
        if (channel.parentId !== ZIG_HELP) return;
        if (!channel.appliedTags.includes(ANSWERED_TAG)) return;

        const users = await reaction.users.fetch();
        const author = users.get(message.author.id);

        if (!author) {
            const at = channel.appliedTags;
            at.splice(channel.appliedTags.indexOf(ANSWERED_TAG), 1);

            await channel.setArchived(false);
            channel.setAppliedTags(at, "Author marked post as unanswered").catch(_ => {});
        }
    }
});

client.login(process.env.TOKEN);
