exports.run = async (client, message) => {
  await message.channel.send("Pong!");
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User",
};

exports.help = {
  name: "ping",
  category: "Miscellaneous",
  description: "Pong!",
  usage: "ping",
};
