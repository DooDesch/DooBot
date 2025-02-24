/* eslint-disable no-unused-vars */
const logger = require('../modules/logger.js')
const { getSettings } = require('../modules/functions.js')

const config = require('../config.js')

// Better SQLite
const SQLite = require('better-sqlite3')
const sql = new SQLite(config.sqliteDatabaseFilePath)

const { memberNicknameMention, channelMention } = require('@discordjs/builders')

module.exports = async (client, oldState, newState) => {
    const userVoiceState = getUserVoiceState(oldState, newState)

    // Find channel called "wer-wo-was" and send a message to it
    const channel = newState.guild.channels.cache.find(
        (channel) => channel.name === 'wer-wo-was'
    )
    if (!channel) return

    // Get the embed message in the voice_states table by guild_id and channel_id
    const vsMessage = await sql
        .prepare('SELECT * FROM voice_states WHERE guild_id = ? AND channel_id = ?')
        .get(newState.guild.id, channel.id)

    // If message was found, edit the embed message
    if (vsMessage) {
        try {
            await client.channels.cache
                .get(vsMessage.channel_id)
                .messages.fetch(vsMessage.message_id)
                .then((message) => {
                    editEmbedMessage(client, userVoiceState, message)
                })

            return
        } catch (error) {
            logger.error(error)
            sql.prepare('DELETE FROM voice_states WHERE id = ?').run(vsMessage.id)
        }
    }

    // If no message was found, create a new embed message
    await createNewEmbedMessage(client, userVoiceState, channel)
}

const createNewEmbedMessage = async (client, userVoiceState, channel) => {
    const messageTemplate = await getEmbedMessageTemplate(client)

    const category = userVoiceState.parent
    if (!category.name) return

    const field = {
        name: `${category.name}`,
        value: `${memberNicknameMention(userVoiceState.userId)}`,
        inline: true,
    }
    messageTemplate.fields.push(field)

    // Create a new embed message
    return await channel.send({ embeds: [messageTemplate] }).then(async (message) => {
        // Add the message to the voice_states table
        return await sql
            .prepare(
                'INSERT INTO voice_states (guild_id, channel_id, message_id) VALUES (?, ?, ?)'
            )
            .run(channel.guild.id, channel.id, message.id)
    })
}

const editEmbedMessage = async (client, userVoiceState, message) => {
    // Edit the embed message
    let embed = message.embeds[0]

    // If the user left the channel
    if (userVoiceState.leftVoice) {
        // Remove the user from the field
        embed = removeUserFromField(embed, userVoiceState)
    }

    // If the user joined the channel
    if (userVoiceState.joinedVoiceChannel) {
        // Add the user to the field
        embed = addUserToField(embed, userVoiceState)
    }

    // If there aren't any field left, add a field to tell the user, that there are no users in the voice chat currently
    if (embed.fields.length === 0) {
        let fieldValueText =
            'Ich werd immer so melancholisch wenn niemand da ist :frowning:'

        try {
            const randomUser = await message.guild.members.cache
                .filter(
                    (member) =>
                        !member?.user?.bot &&
                        member.presence &&
                        member.presence.status !== 'offline' &&
                        member._roles.length > 0
                )
                .random()

            logger.log(`Found user : ${randomUser.user.username}`)

            if (randomUser) {
                // Get the settings for the guild
                const settings = getSettings(message.guild.id)

                const randomUserRole = await randomUser.roles.cache
                    .filter(
                        (role) =>
                            role?.name !== '@everyone' &&
                            !roleNameContainsExcludePrefix(role?.name, settings)
                    )
                    .random()

                logger.log(`Found role : ${randomUserRole.name}`)

                if (randomUserRole) {
                    fieldValueText = `Frag doch mal ${memberNicknameMention(
                        randomUser.id
                    )}, ob er/sie Lust hat \`${randomUserRole.name}\` zu zocken.`
                }
            }
        } catch (error) {
            logger.error(error)
        }

        const field = {
            name: ':information_source: Zurzeit sind keine User im Voice-Chat',
            value: fieldValueText,
            inline: true,
        }
        embed.fields.push(field)
    }

    embed.timestamp = new Date()

    await message.edit({
        embeds: [embed],
    })
}

const getEmbedMessageTemplate = async (client) => {
    // Get channel called 'roles'
    const channel = await client.channels.cache.find(
        (channel) => channel.name === 'roles'
    )

    return {
        title: ':speaking_head: User in Voice-Channel',
        description: `${channelMention(
            channel.id
        )} Hier findest du alle Rollen.\n\n_____`,
        color: 39129,
        timestamp: new Date(),
        footer: {
            text: 'Füge dir Rollen hinzu, um Zugriff auf die Channel zu bekommen',
            icon_url: '',
        },
        fields: [],
    }
}

const editUserInField = (embed, userVoiceState, removeOnly = false) => {
    const emojis = [':mute:', ':video_camera:']

    const wasMuted = userVoiceState.wasMuted || userVoiceState.wasDeafen ? emojis[0] : ''
    const wasVideoing =
        userVoiceState.wasVideoing || userVoiceState.wasStreaming ? emojis[1] : ''

    const muted = userVoiceState.mute || userVoiceState.deaf ? emojis[0] : ''
    const video = userVoiceState.video || userVoiceState.streaming ? emojis[1] : ''

    const userName = memberNicknameMention(userVoiceState.userId)


    // Remove emojis, that are behind the users mention
    embed.fields.forEach((field) => {
        if (field.value.includes(userVoiceState.userId)) {
            field.value = field.value.replace(
                `${userName}${wasMuted}${wasVideoing}`,
                `${userName}`
            )
        }

        emojis.forEach((emoji) => {
            if (field.value.startsWith(emoji)) {
                field.value = field.value.replace(emoji, '')
            }
        })
    })

    if (!userVoiceState.leftVoice && !removeOnly) {
        // Add emojis behind the users mention by replacing the user's mention with the emojis
        embed.fields.forEach((field) => {
            if (field.value.includes(userVoiceState.userId)) {
                field.value = field.value.replace(
                    `${userName}`,
                    `${userName}${muted}${video}`
                )
            }
        })
    }

    return embed
}

const removeUserFromField = (embed, userVoiceState) => {
    embed = editUserInField(embed, userVoiceState, true)

    const userName = memberNicknameMention(userVoiceState.userId)

    // Foreach field the user is in, remove the user from the field
    embed.fields.forEach((field) => {
        if (field.value.includes(`\n${userName}`)) {
            field.value = field.value.replace(`\n${userName}`, '')
        }
        if (field.value.includes(`${userName}\n`)) {
            field.value = field.value.replace(`${userName}\n`, '')
        }
        if (field.value.includes(`${userName}`)) {
            field.value = field.value.replace(`${userName}`, '')
        }
    })

    if (userVoiceState.switchedToNewCategory) {
        // Check for each field, if the value is empty
        // If it is empty, remove the field
        embed.fields = embed.fields.filter(
            (field) => field.value !== '' && !field.name.includes(':information_source:')
        )
    }

    return embed
}

const addUserToField = (embed, userVoiceState) => {
    if (userVoiceState.switchedToNewCategory || userVoiceState.switchedVoiceChannel) {
        embed = removeUserFromField(embed, userVoiceState)
    }

    const fieldName = userVoiceState.parent?.name || userVoiceState.channel.name

    // Check if a field with fieldName exists
    const field = embed.fields.find((field) => field.name === fieldName)

    // If no field exists, create a new field, else add the user to it
    if (!field) {
        const field = {
            name: `${fieldName}`,
            value: `${memberNicknameMention(userVoiceState.userId)}`,
            inline: true,
        }
        embed.fields.push(field)
    } else if (!field.value.includes(userVoiceState.userId)) {
        field.value += `\n${memberNicknameMention(userVoiceState.userId)}`
    }

    embed = editUserInField(embed, userVoiceState, false)

    return embed
}

const roleNameContainsExcludePrefix = (roleName, settings) => {
    return settings.excludeRolesWithPrefix.some((prefix) => roleName.startsWith(prefix))
}

const getUserVoiceState = (oldState, newState) => {
    // Get user
    const user = newState.member || oldState.member

    return {
        userId: newState.id || oldState.id,
        user: user,
        deaf: newState.selfDeaf || newState.serverDeaf || false,
        mute: newState.selfMute || newState.serverMute || false,
        video: newState.selfVideo,
        streaming: newState.streaming,
        wasDeafen: oldState.selfDeaf || oldState.serverDeaf || false,
        wasMuted: oldState.selfMute || oldState.serverMute || false,
        wasVideoing: oldState.selfVideo,
        wasStreaming: oldState.streaming,
        suppress: newState.suppress,
        channel: newState.channel || oldState.channel,
        parent: newState.channel?.parent || oldState.channel?.parent,
        guildId: newState.guild.id || oldState.guild.id,
        joinedVoiceChannel: newState.channelId !== null,
        leftVoiceChannel: oldState.channelId !== null,
        joinedVoice: newState.channelId && !oldState.channelId,
        leftVoice: oldState.channelId && !newState.channelId,
        switchedVoiceChannel: newState.channel?.id !== oldState.channel?.id,
        switchedToNewCategory:
            newState.channel?.parent?.id !== oldState.channel?.parent?.id,
    }
}
