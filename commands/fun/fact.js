const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const path = require("path");

module.exports.data = {
	name: "fact",
	description: "Phát audio duysuy hoặc gửi lời nhắn của bạn.",
	type: 1,
	options: [
		{
			name: "option",
			description: "Chọn hành động",
			type: 3,
			required: true,
			choices: [
				{ name: "reply muon", value: "replymuon" },
				{ name: "tử tế đến đau lòng", value: "tutedendau" },
			],
		},
		{
			name: "user",
			description: "Người sẽ được tag trong tin nhắn",
			type: 6,
			required: false,
		},
		// {
		//     name: "another_option",
		//     description: "Ví dụ option khác",
		//     type: 3,
		// },
		// {
		//     name: "more_option",
		//     description: "Một option dự phòng",
		//     type: 3,
		// },
	],
	integration_types: [0],
	contexts: [0],
};

/**
 * @param { object } command
 * @param { import("discord.js").CommandInteraction } command.interaction
 */
module.exports.execute = async ({ interaction }) => {
	const option = interaction.options.getString("option");
	const targetUser = interaction.options.getUser("user");

	let message;
	let file;

	switch (option) {
		case "replymuon":
			message = "Tại sao bạn lại tệ đến mức như vậy?? Tôi coi bạn quan trọng luôn rep bạn sớm mà bạn lại để tôi chờ đợi vậy sao?";
			file = "duysuy.mp3";
			break;
		case "tutedendau":
			message =
				"chia tay rồi sao còn nhớ đến người ta? Bạn thương người ta hết lòng nhưng hãy coi người ta đã làm được gì cho mình.";
			file = "duysuy2.mp3";
			break;
		default:
			return;
	}

	const voiceChannel = interaction.member?.voice?.channel;
	if (!voiceChannel) {
		if (targetUser) message += ` ${targetUser}`;
		await interaction.reply(message);
		return;
	}

	await interaction.deferReply({ ephemeral: true }).catch(() => {});
	const connection = joinVoiceChannel({
		channelId: voiceChannel.id,
		guildId: voiceChannel.guild.id,
		adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		selfDeaf: false,
	});
	const player = createAudioPlayer();
	const resource = createAudioResource(path.join(process.cwd(), "audio", file));
	player.play(resource);
	connection.subscribe(player);
	player.on(AudioPlayerStatus.Idle, () => connection.destroy());
	await interaction.deleteReply().catch(() => {});
};
