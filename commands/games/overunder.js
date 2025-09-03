const { EmbedBuilder } = require("discord.js");
const { useFunctions, useDB } = require("@zibot/zihooks");

module.exports.data = {
	name: "overunder",
	description: "Trò chơi lắc xúc xắc Over/Under",
	type: 1,
	options: [
		{
			name: "choice",
			description: "Chọn over hay under",
			type: 3,
			required: true,
			choices: [
				{ name: "Over", value: "over" },
				{ name: "Under", value: "under" },
			],
		},
		{
			name: "bet",
			description: "Số coin cược hoặc 'all'",
			type: 3,
			required: false,
		},
	],
	integration_types: [0],
	contexts: [0, 1],
};

/**
 * @param { object } command - object command
 * @param { import("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import("../../lang/vi.js") } command.lang - language
 */
module.exports.execute = async ({ interaction, lang }) => {
	const ZiRank = useFunctions().get("ZiRank");
	const db = useDB();
	const choice = interaction.options.getString("choice");
	const betInput = interaction.options.getString("bet");

	let bet = 100;
	if (betInput) {
		if (betInput.toLowerCase() === "all") {
			bet = db ? (await db.ZiUser.findOne({ userID: interaction.user.id }))?.coin || 0 : 0;
		} else {
			const parsed = parseInt(betInput, 10);
			if (isNaN(parsed) || parsed <= 0) {
				return interaction.reply({ content: "Bet amount must be a positive number.", ephemeral: true });
			}
			bet = parsed;
		}
	}
	const dice1 = Math.floor(Math.random() * 6) + 1;
	const dice2 = Math.floor(Math.random() * 6) + 1;
	const total = dice1 + dice2;
	const isOver = total >= 8;
	const isUnder = total <= 6;
	const isTie = total === 7;
	const win = (choice === "over" && isOver) || (choice === "under" && isUnder);
	const words = lang?.OverUnder ?? {};
	const displayChoice = choice === "over" ? (words.over ?? "Over") : (words.under ?? "Under");
	const resultText =
		isTie ? (words.exactly ?? "It's exactly 7!")
		: isOver ? (words.over ?? "Over")
		: (words.under ?? "Under");
	const message =
		isTie ? (words.tie ?? "It's a tie! No coins lost.")
		: win ? (words.win ?? "You won!")
		: (words.lose ?? "You lost!");

	const embed = new EmbedBuilder()
		.setTitle("Over/Under")
		.setColor("#5865F2")
		.setDescription(
			`${words.chosen ?? "Bạn chọn"}: **${displayChoice}**\n${words.result ?? "Kết quả"}: **${total} (${resultText})**\n${words.bet ?? "Tiền cược"}: **${bet}**\n${message}`,
		);

	await interaction.reply({ embeds: [embed] });
	const CoinADD =
		isTie ? 0
		: win ? bet * 2
		: -bet;
	await ZiRank.execute({ user: interaction.user, XpADD: 0, CoinADD });
};
