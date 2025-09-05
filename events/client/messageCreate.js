const { Events, Message } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const path = require("path");
const { useResponder, useConfig, useFunctions, useCommands, useLogger, modinteraction, useAI } = require("@catbot/cathook");
const config = useConfig();
const { useQueue } = require("discord-player");
const mentionRegex = /@(everyone|here|ping)/;
const ziicon = require("./../../utility/icon");

const Commands = useCommands();
const Functions = useFunctions();

module.exports = {
	name: Events.MessageCreate,
	type: "events",
	enable: config?.DevConfig?.AutoResponder,
};

/**
 * @param { Message } message
 */
module.exports.execute = async (message) => {
	if (!message.client.isReady()) return;
	if (message.author.bot) return;
	// Get the user's language preference
	const langfunc = Functions.get("CyberRank");
	const lang = await langfunc.execute({ user: message.author, XpADD: 0 });

	if (message.content.trim().toLowerCase() === "duysuy") {
		const voiceChannel = message.member?.voice?.channel;
		if (!voiceChannel) {
			await message.reply("Duy chỉ hơi suy tí thôi rồi  mọi chuyện sẽ ổn, chỉ có vết thương lòng sẽ mãi ở đó theo thời gian 💔");
	if (message.content.trim().toLowerCase() === "dysuy") {
		const voiceChannel = message.member?.voice?.channel;
		if (!voiceChannel) {
			await message.reply("Duy chỉ hơi suy thôi rồi từ từ mọi thứ sẽ qua, chỉ có vết thương lòng còn ở đó");
      return;
		}
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			selfDeaf: false,
		});
		const player = createAudioPlayer();
		const resource = createAudioResource(path.join(process.cwd(), "audio", "duysuy.mp3"));
		player.play(resource);
		connection.subscribe(player);
		player.on(AudioPlayerStatus.Idle, () => connection.destroy());
		return;
	}
	//tts
	if (message.channel.isThread() && message.channel.name.startsWith(`${message?.client?.user?.username} TTS |`)) {
		return await reqTTS(message, lang);
	}
	// Auto Responder
	if (config?.DevConfig?.AutoResponder && message?.guild && (await reqreponser(message))) return; // Auto Responder

	// DM channel auto reply = AI
	if (!message.guild || message.mentions.has(message.client.user)) {
		await reqai(message, lang);
	}
};

/**
 * @param { Message } message
 */

const reqai = async (message, lang) => {
	if (mentionRegex.test(message.content?.toLowerCase())) return;
	const prompt = message.content.replace(`<@${message.client.user.id}>`, "").trim();
	if (!prompt) {
		const commsnd = Commands.get("help");
		if (commsnd) {
			modinteraction(message);
			await commsnd.execute({ interaction: message, lang });
		}
		return;
	}
	await message.channel.sendTyping().catch(() => {
		return; // khong the gui message nen bo qua
	});

	try {
		const result = await useAI().run(prompt, message.author, lang);
		await message.reply(result);
	} catch (err) {
		useLogger().error(`Error in generating content: ${err}`);
		const replies = await message.reply("❌ | Không thể tạo nội dung! Xin hãy chờ ít phút");
		setTimeout(() => {
			replies.delete();
		}, 5000);
	}
};

/**
 * @param { Message } message
 */

const reqreponser = async (message) => {
	const parseVar = useFunctions().get("getVariable");
	const guildResponders = useResponder().get(message.guild.id) ?? [];

	const trigger = guildResponders.find((responder) => {
		const msgContent = message.content.toLowerCase();
		const triggerContent = responder.trigger.toLowerCase();

		switch (responder.matchMode) {
			case "exactly":
				return msgContent === triggerContent;
			case "startswith":
				return msgContent.startsWith(triggerContent);
			case "endswith":
				return msgContent.endsWith(triggerContent);
			case "includes":
				return msgContent.includes(triggerContent);
			default:
				return msgContent === triggerContent;
		}
	});

	if (trigger) {
		try {
			await message.reply(parseVar.execute(trigger.response, message));
			return true;
		} catch (error) {
			console.error(`Failed to send response: ${error.message}`);
			return false;
		}
	}
	return false;
};

/**
 * @param { Message } message
 */

const reqTTS = async (message, lang) => {
	const queue = useQueue(message.guild.id);
	modinteraction(message);
	const tts = await Functions.get("TextToSpeech");
	if (queue?.metadata) await message.react(ziicon.yess);
	const context = message.content.replace(`<@${message.client.user.id}>`, "").trim();

	await tts.execute(message, context, lang, { queue });
};
