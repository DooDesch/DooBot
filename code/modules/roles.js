const logger = require("./logger.js");
const config = require("../config.js");
const SQLite = require("better-sqlite3");
const sql = new SQLite(config.sqliteDatabaseFilePath);
const {
  MessageActionRow,
  MessageSelectMenu,
  MessageEmbed,
} = require("discord.js");

const { roleNameToLabel, orderBy } = require("../modules/functions");

async function addRoleToSelectMenu(channel, role) {
  const hasSelectMenu = await checkForRoleSelectMenuInChannel(channel);

  if (!hasSelectMenu) {
    return await createRoleSelectMenu(channel, role);
  }

  return await updateRoleSelectMenu(channel, role);
}

async function createSelectMenuIfItsMissing(channel) {
  const hasSelectMenu = await checkForRoleSelectMenuInChannel(channel);

  if (!hasSelectMenu) {
    return await createRoleSelectMenu(channel);
  }

  return false;
}

async function deleteRoleFromSelectMenu(channel) {
  return await updateRoleSelectMenu(channel);
}

async function checkForRoleSelectMenuInChannel(channel) {
  // Get the select menu for this channel from the database
  const selectMenu = await sql
    .prepare(`SELECT * FROM select_menus WHERE channel_id = ?`)
    .get(channel.id);

  // Check if the channel has a role select menu message
  const roleSelectMenuMessage = channel.messages.cache.find(
    (m) => m.id === selectMenu?.message_id
  );

  // Check if the message still exists, if not, delete the select menu from the database
  if (!roleSelectMenuMessage) {
    await sql
      .prepare(`DELETE FROM select_menus WHERE channel_id = ?`)
      .run(channel.id);
  }

  return !!roleSelectMenuMessage;
}

async function createRoleSelectMenu(channel, role = false) {
  // Get all roles with the color blue
  const guildRoles = channel.guild.roles.cache.filter(
    (r) => r.color === 3447003 && r.id !== role.id
  );

  const roleObject = role
    ? {
        label: roleNameToLabel(role.name),
        value: role.id,
      }
    : undefined;

  const options = [
    {
      label: `!!- Ausgewählte Rollen löschen -!!`,
      description: `Wenn ausgewählt, werden alle ausgewählten Rollen gelöscht!`,
      value: "deleteSelectedRoles",
    },
    roleObject,
  ];

  // Add each role into the options array
  guildRoles.forEach((role) => {
    options.push({
      label: roleNameToLabel(role.name),
      value: role.id,
    });
  });

  const sortedOptions = orderBy(options, ["label", "value"]);

  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId("roleSelection")
      .setPlaceholder("Nichts ausgewählt")
      .setMinValues(1)
      .setMaxValues(options.length)
      .addOptions(sortedOptions)
  );

  const embed = new MessageEmbed()
    .setColor(0x0099ff)
    .setTitle("Game-Rollen auswählen")
    .setDescription(
      `Hier kannst du deine Rollen auswählen.
            \n
            \n**Mehrere Rollen** können gleichzeitig gewählt werden.
            \n
            \n**Löschen von Rollen** ist durch auswählen von "Ausgewählte Rollen löschen" machbar.
            \n
            \n**Fehlt eine Rolle**, dann frag gerne im Text-Channel nach.
            \n`
    );

  const message = await channel.send({ embeds: [embed], components: [row] });

  // Add the select menu to the database
  await sql
    .prepare(
      `INSERT INTO select_menus (guild_id, channel_id, message_id) VALUES (?, ?, ?)`
    )
    .run(channel.guild.id, channel.id, message.id);

  return message;
}

async function updateRoleSelectMenu(channel, role = false) {
  // Get the select menu for this channel from the database
  const selectMenu = await sql
    .prepare(`SELECT * FROM select_menus WHERE channel_id = ?`)
    .get(channel.id);

  // Get the role select menu message
  const roleSelectMenuMessage = channel.messages.cache.find(
    (m) => m.id === selectMenu.message_id
  );

  // Get the role select menu
  const roleSelectMenu = new MessageSelectMenu(
    roleSelectMenuMessage.components[0].components.find(
      (c) => c.customId === "roleSelection"
    )
  );

  // Check all roles in the roleSelectMenu.options array, if the role still exists
  roleSelectMenu.options = roleSelectMenu.options.filter((o) => {
    if (o.value === "deleteSelectedRoles") return o;

    const roleExists = channel.guild.roles.cache.find((r) => r.id === o.value);

    if (roleExists) return o;
  });

  const options = [];

  if (role) {
    options.push({
      label: roleNameToLabel(role.name),
      value: role.id,
    });
  }

  const sortedOptions = orderBy(options, ["label", "value"]);

  // Add the role to the select menu
  const row = new MessageActionRow().addComponents(
    roleSelectMenu
      .setMaxValues(roleSelectMenu.options.length + options.length)
      .addOptions(sortedOptions)
  );

  // Update the role select menu message
  await roleSelectMenuMessage.edit({
    embeds: roleSelectMenuMessage.embeds,
    components: [row],
  });

  // Update the select menu in the database
  await sql
    .prepare(`UPDATE select_menus SET message_id = ? WHERE channel_id = ?`)
    .run(roleSelectMenuMessage.id, channel.id);

  return roleSelectMenuMessage;
}

// These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
process.on("uncaughtException", (err) => {
  const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
  logger.error(`Uncaught Exception: ${errorMsg}`);
  console.error(err);
  // Always best practice to let the code crash on uncaught exceptions.
  // Because you should be catching them anyway.
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled rejection: ${err}`);
  console.error(err);
});

module.exports = {
  addRoleToSelectMenu,
  deleteRoleFromSelectMenu,
  createSelectMenuIfItsMissing,
};
