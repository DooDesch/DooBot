const logger = require('../modules/logger.js')
const { getSettings, permlevel } = require('../modules/functions.js')
const config = require('../config.js')
const { roleMention } = require('@discordjs/builders')

module.exports = async (client, interaction) => {
    // If it's an interaction on a select menu
    handleSelectMenu(client, interaction)

    // If it's a command
    handleCommand(client, interaction)
}

async function handleCommand(client, interaction) {
    if (!interaction.isCommand()) return

    // Grab the settings for this server from Enmap.
    // If there is no guild, get default conf (DMs)
    const settings = (interaction.settings = getSettings(interaction.guild))

    // Get the user or member's permission level from the elevation
    const level = permlevel(interaction)

    // Grab the command data from the client.container.slashcmds Collection
    const cmd = client.container.slashcmds.get(interaction.commandName)

    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return

    // Since the permission system from Discord is rather limited in regarding to
    // Slash Commands, we'll just utilise our permission checker.
    if (level < client.container.levelCache[cmd.conf.permLevel]) {
        // Due to the nature of interactions we **must** respond to them otherwise
        // they will error out because we didn't respond to them.
        return await interaction.reply({
            content: `This command can only be used by ${cmd.conf.permLevel}'s only`,
            // This will basically set the ephemeral response to either announce
            // to everyone, or just the command executioner. But we **HAVE** to
            // respond.
            ephemeral: settings.systemNotice !== 'true',
        })
    }

    // If everything checks out, run the command
    try {
        await cmd.run(client, interaction)
        logger.log(
            `${config.permLevels.find((l) => l.level === level).name} ${
                interaction.user.id
            } ran slash command ${interaction.commandName}`,
            'cmd'
        )
    } catch (e) {
        console.error(e)
        if (interaction.replied)
            interaction
                .followUp({
                    content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``,
                    ephemeral: true,
                })
                .catch((e) =>
                    console.error('An error occurred following up on an error', e)
                )
        else if (interaction.deferred)
            interaction
                .editReply({
                    content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``,
                    ephemeral: true,
                })
                .catch((e) =>
                    console.error('An error occurred following up on an error', e)
                )
        else
            interaction
                .reply({
                    content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``,
                    ephemeral: true,
                })
                .catch((e) => console.error('An error occurred replying on an error', e))
    }
}

async function handleSelectMenu(client, interaction) {
    if (!interaction.isSelectMenu()) return

    const interactionData = {
        id: interaction.customId,
        roles: interaction.values,
    }

    if (interactionData.id === 'roleSelection') {
        let deleteRoles = interactionData.roles.includes('deleteSelectedRoles')

        // If the user has selected the role with value `deleteSelectedRoles`, remove it from the roles
        if (deleteRoles) {
            interactionData.roles = interactionData.roles.filter(
                (r) => r !== 'deleteSelectedRoles'
            )
        }

        const roles = await interactionData.roles.map((r) =>
            interaction.guild.roles.cache.get(r)
        )
        const userRoles = await interaction.guild.members.cache
            .get(interaction.user.id)
            .roles.cache.filter((r) => r.color === 3447003)

        let hasChanges = false

        try {
            if (!deleteRoles) {
                const rolesToGive = roles.filter((r) => !userRoles.has(r.id))
                const rolesToGiveString = getRolesString(rolesToGive)

                if (rolesToGiveString.length) {
                    hasChanges = true

                    await rolesToGive.forEach(async (r) => {
                        await giveRoleBySelect(client, interaction, r)
                    })

                    await interaction.reply({
                        content: `Added role(s): ${rolesToGiveString}`,
                        ephemeral: true,
                    })
                }
            } else {
                const roleToRemove = roles.filter((r) => userRoles.has(r.id))
                const roleToRemoveString = getRolesString(roleToRemove)

                if (roleToRemoveString.length) {
                    hasChanges = true

                    await roleToRemove.forEach(async (r) => {
                        await removeRoleBySelect(client, interaction, r)
                    })

                    await interaction.reply({
                        content: `Removed role(s): ${roleToRemoveString}`,
                        ephemeral: true,
                    })
                }
            }
        } catch (error) {
            logger.error(error)
            await interaction?.reply({
                content: `There was a problem giving/removing roles`,
                ephemeral: true,
            })
        }

        if (!hasChanges) {
            const contentString = deleteRoles
                ? 'Du besitzt die ausgewählten Rollen bereits nicht mehr.'
                : 'Du besitzt die ausgewählten Rollen bereits.'

            await interaction.reply({
                content: contentString,
                ephemeral: true,
            })
        }
    }
}

function getRolesString(roles) {
    return roles.map((r) => roleMention(r.id)).join(', ')
}

async function giveRoleBySelect(client, interaction, role) {
    return await interaction.guild.members.cache.get(interaction.user.id).roles.add(role)
}

async function removeRoleBySelect(client, interaction, role) {
    return await interaction.guild.members.cache
        .get(interaction.user.id)
        .roles.remove(role)
}
