const { MessageActionRow, MessageSelectMenu } = require("discord.js");

exports.run = async (client, message) => {
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId("roleSelection")
      .setPlaceholder("Nichts ausgewählt")
      .addOptions([
        {
          label: "Minecraft",
          description: "Diese Rolle bla bla",
          value: "minecraft",
        },
        {
          label: "League of Legends",
          description: "Dies das Rolle bla",
          value: "league-of-legends",
        },
      ])
  );

  await message.channel.send({ content: "Pong!", components: [row] });
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User",
};

exports.help = {
  name: "ping",
  category: "Miscellaneous",
  description: "Gives some useful bot statistics",
  usage: "ping",
};
