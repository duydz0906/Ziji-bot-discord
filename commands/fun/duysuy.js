const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const path = require("path");

module.exports.data = {
	name: "duysuy",
	description: "Phát audio duysuy hoặc gửi lời động viên",
	type: 1,
	options: [],
	integration_types: [0],
	contexts: [0],
};

/**
 * @param { object } command
 * @param { import("discord.js").CommandInteraction } command.interaction
 */
module.exports.execute = async ({ interaction }) => {
	const voiceChannel = interaction.member?.voice?.channel;
	if (!voiceChannel) {
		await interaction.reply("Duy chỉ hơi suy thôi rồi từ từ mọi thứ sẽ qua, chỉ có vết thương lòng còn ở đó 💔");
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
	const resource = createAudioResource(path.join(process.cwd(), "audio", "duysuy.mp3"));
	player.play(resource);
	connection.subscribe(player);
	player.on(AudioPlayerStatus.Idle, () => connection.destroy());
	await interaction.deleteReply().catch(() => {});
};
