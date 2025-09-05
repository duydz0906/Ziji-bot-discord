const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { useFunctions } = require("@catbot/cathook");

module.exports.data = {
	name: "rpsls",
	description: "Chơi kéo búa bao thằn lằn Spock",
	type: 1,
	options: [
		{
			name: "opponent",
			description: "Đối thủ",
			type: 6,
			required: false,
		},
	],
	integration_types: [0],
	contexts: [0, 1],
};

const CHOICES = {
	rock: { emoji: "✊" },
	paper: { emoji: "🖐️" },
	scissors: { emoji: "✌️" },
	lizard: { emoji: "🦎" },
	spock: { emoji: "🖖" },
};

function getButtons(lang) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("rock")
			.setLabel(lang?.RPSLS?.rock ?? "Rock")
			.setEmoji("✊")
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId("paper")
			.setLabel(lang?.RPSLS?.paper ?? "Paper")
			.setEmoji("🖐️")
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId("scissors")
			.setLabel(lang?.RPSLS?.scissors ?? "Scissors")
			.setEmoji("✌️")
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId("lizard")
			.setLabel(lang?.RPSLS?.lizard ?? "Lizard")
			.setEmoji("🦎")
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId("spock")
			.setLabel(lang?.RPSLS?.spock ?? "Spock")
			.setEmoji("🖖")
			.setStyle(ButtonStyle.Primary),
	);
}

function determineWinner(a, b) {
	if (a === b) return 0;
	const wins = {
		rock: ["scissors", "lizard"],
		paper: ["rock", "spock"],
		scissors: ["paper", "lizard"],
		lizard: ["spock", "paper"],
		spock: ["scissors", "rock"],
	};
	return wins[a].includes(b) ? 1 : -1;
}

/**
 * @param { object } command
 * @param { import("discord.js").CommandInteraction } command.interaction
 * @param { import("../../lang/vi.js") } command.lang
 */
module.exports.execute = async ({ interaction, lang }) => {
	const CyberRank = useFunctions().get("CyberRank");
	const opponent = interaction.options.getUser("opponent");

	if (!opponent) {
		// vs bot
		const reply = await interaction.reply({
			content: lang?.RPSLS?.choose ?? "Hãy chọn!",
			components: [getButtons(lang)],
			ephemeral: true,
			fetchReply: true,
		});

		try {
			const choiceInt = await reply.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id,
				time: 15_000,
			});
			const userChoice = choiceInt.customId;
			const botChoice = Object.keys(CHOICES)[Math.floor(Math.random() * 5)];
			const result = determineWinner(userChoice, botChoice);
			await choiceInt.update({ content: lang?.RPSLS?.chosen ?? "Đã chọn!", components: [] });

			const embed = new EmbedBuilder()
				.setTitle("RPSLS")
				.setColor("Random")
				.setDescription(
					`${lang?.RPSLS?.chosen ?? "Bạn chọn"}: ${lang?.RPSLS?.[userChoice] ?? userChoice} ${CHOICES[userChoice].emoji}\n${lang?.RPSLS?.bot ?? "Bot chọn"}: ${lang?.RPSLS?.[botChoice] ?? botChoice} ${CHOICES[botChoice].emoji}\n` +
						(result === 0 ? (lang?.RPSLS?.tie ?? "Hòa!")
						: result === 1 ? (lang?.RPSLS?.win ?? "Bạn thắng!")
						: (lang?.RPSLS?.lose ?? "Bạn thua!")),
				);

			await interaction.followUp({ embeds: [embed] });
			const CoinADD =
				result === 0 ? 0
				: result === 1 ? 100
				: -100;
			await CyberRank.execute({ user: interaction.user, XpADD: 0, CoinADD });
		} catch (e) {
			await interaction.editReply({ content: lang?.RPSLS?.timeout ?? "Hết thời gian!", components: [] });
		}
		return;
	}

	if (opponent.bot || opponent.id === interaction.user.id) {
		return interaction.reply({
			content: lang?.RPSLS?.invalidOpponent ?? "Đối thủ không hợp lệ!",
			ephemeral: true,
		});
	}

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("accept")
			.setLabel(lang?.RPSLS?.accept ?? "Accept")
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId("decline")
			.setLabel(lang?.RPSLS?.decline ?? "Decline")
			.setStyle(ButtonStyle.Danger),
	);

	const challengeMsg = await interaction.reply({
		content: (lang?.RPSLS?.challenge ?? "##user## thách đấu bạn.").replace("##user##", `<@${interaction.user.id}>`),
		components: [row],
		fetchReply: true,
	});

	try {
		const acceptInt = await challengeMsg.awaitMessageComponent({
			filter: (i) => i.user.id === opponent.id,
			time: 15_000,
		});

		if (acceptInt.customId === "decline") {
			await acceptInt.update({ content: lang?.RPSLS?.declined ?? "Đối thủ đã từ chối!", components: [] });
			return;
		}

		await acceptInt.update({ content: lang?.RPSLS?.accepted ?? "Trò chơi bắt đầu!", components: [] });

		const selections = {};
		const challengerMsg = await interaction.followUp({
			content: lang?.RPSLS?.choose ?? "Hãy chọn!",
			components: [getButtons(lang)],
			ephemeral: true,
			fetchReply: true,
		});
		const opponentMsg = await acceptInt.followUp({
			content: lang?.RPSLS?.choose ?? "Hãy chọn!",
			components: [getButtons(lang)],
			ephemeral: true,
			fetchReply: true,
		});

		const p1 = challengerMsg
			.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, time: 15_000 })
			.then((i) => {
				selections[interaction.user.id] = i.customId;
				return i.update({ content: lang?.RPSLS?.chosen ?? "Đã chọn!", components: [] });
			})
			.catch(() => {});
		const p2 = opponentMsg
			.awaitMessageComponent({ filter: (i) => i.user.id === opponent.id, time: 15_000 })
			.then((i) => {
				selections[opponent.id] = i.customId;
				return i.update({ content: lang?.RPSLS?.chosen ?? "Đã chọn!", components: [] });
			})
			.catch(() => {});

		await Promise.all([p1, p2]);

		if (!selections[interaction.user.id] || !selections[opponent.id]) {
			await interaction.followUp({ content: lang?.RPSLS?.timeout ?? "Hết thời gian!" });
			return;
		}

		const result = determineWinner(selections[interaction.user.id], selections[opponent.id]);
		const embed = new EmbedBuilder()
			.setTitle("RPSLS")
			.setColor("Random")
			.setDescription(
				`<@${interaction.user.id}>: ${lang?.RPSLS?.[selections[interaction.user.id]] ?? selections[interaction.user.id]} ${CHOICES[selections[interaction.user.id]].emoji}\n<@${opponent.id}>: ${lang?.RPSLS?.[selections[opponent.id]] ?? selections[opponent.id]} ${CHOICES[selections[opponent.id]].emoji}\n` +
					(result === 0 ? (lang?.RPSLS?.tie ?? "Hòa!")
					: result === 1 ? `<@${interaction.user.id}> ${lang?.RPSLS?.win ?? "Thắng!"}`
					: `<@${opponent.id}> ${lang?.RPSLS?.win ?? "Thắng!"}`),
			);

		await interaction.followUp({ embeds: [embed] });

		if (result === 1) {
			await Promise.all([
				CyberRank.execute({ user: interaction.user, XpADD: 0, CoinADD: 100 }),
				CyberRank.execute({ user: opponent, XpADD: 0, CoinADD: -100 }),
			]);
		} else if (result === -1) {
			await Promise.all([
				CyberRank.execute({ user: interaction.user, XpADD: 0, CoinADD: -100 }),
				CyberRank.execute({ user: opponent, XpADD: 0, CoinADD: 100 }),
			]);
		} else {
			await Promise.all([
				CyberRank.execute({ user: interaction.user, XpADD: 0, CoinADD: 0 }),
				CyberRank.execute({ user: opponent, XpADD: 0, CoinADD: 0 }),
			]);
		}
	} catch (e) {
		await interaction.editReply({ content: lang?.RPSLS?.timeout ?? "Hết thời gian!", components: [] });
	}
};
