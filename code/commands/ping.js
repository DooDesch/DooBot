const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require('discord.js')

const { roleNameToLabel } = require('../modules/functions')

exports.run = async (client, message) => {
    // // Get all roles with the color blue
    // const guildRoles = message.guild.roles.cache.filter((r) => r.color === 3447003)

    // const options = []

    // // Add each role into the options array
    // guildRoles.forEach((role) => {
    //     options.push({
    //         label: roleNameToLabel(role.name),
    //         value: role.id,
    //     })
    // })

    // const row = new MessageActionRow().addComponents(
    //     new MessageSelectMenu()
    //         .setCustomId('roleSelection')
    //         .setPlaceholder('Nichts ausgewählt')
    //         .setMinValues(1)
    //         .setMaxValues(guildRoles.length)
    //         .addOptions(options)
    // )

    // const embed = new MessageEmbed()
    //     .setColor(0x0099ff)
    //     .setTitle('Game-Rollen auswählen')
    //     .setDescription(
    //         'Hier kannst du deine Rollen auswählen.\nWähle eine oder mehrere Rollen aus.'
    //     )

    // await message.channel.send({ embeds: [embed], components: [row] })

    await message.channel.send('Pong!')
}

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: 'User',
}

exports.help = {
    name: 'ping',
    category: 'Miscellaneous',
    description: 'Pong!',
    usage: 'ping',
}
