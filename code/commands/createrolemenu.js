const { createSelectMenuIfItsMissing } = require('../modules/roles.js')
const config = require('../config.js')
const SQLite = require('better-sqlite3')
const sql = new SQLite(config.sqliteDatabaseFilePath)

const { channelMention } = require('@discordjs/builders')

exports.run = async (client, message) => {
    const rolesChannel = await message.guild.channels.cache.find(
        (c) => c.name === 'roles'
    )

    // Get the select menu for this channel from the database
    const selectMenu = await sql
        .prepare(`SELECT * FROM select_menus WHERE channel_id = ?`)
        .get(rolesChannel.id)

    if (selectMenu) {
        // Check if the channel has a role select menu message
        const roleSelectMenuMessage = await rolesChannel.messages.cache.find(
            (m) => m.id === selectMenu?.message_id
        )

        if (roleSelectMenuMessage) {
            // Delete the message
            await roleSelectMenuMessage.delete()
        }

        // Delete the database entry
        await sql
            .prepare(`DELETE FROM select_menus WHERE message_id = ?`)
            .run(roleSelectMenuMessage.id)
    }

    await createSelectMenuIfItsMissing(rolesChannel)

    // Reply that the message has been created
    await message.channel.send(
        `${channelMention(rolesChannel.id)} - A new role select menu has been created.`
    )
}

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: 'Administrator',
}

exports.help = {
    name: 'createrolemenu',
    category: 'System',
    description: 'Creates a role select menu for the roles channel.',
    usage: 'createrolemenu',
}
