// All tables that should be generated in sqlite are created here.

const config = require('../config.js')

// Better SQLite
const SQLite = require('better-sqlite3')
const sql = new SQLite(config.sqliteDatabaseFilePath)

const logger = require('../modules/logger.js')

module.exports = async (client) => {
    return await Promise.all([
        createReactionMessagesTable(client),
        createVoiceStatesTable(client),
        createRolesTable(client),
        createSelectMenusTable(client),
    ]).then(() => {
        logger.log('Tables created.', 'log')
    })
}

const createReactionMessagesTable = async (client) => {
    // Check if the table reaction_messages exists
    const table = await sql
        .prepare(
            `SELECT count(*) FROM sqlite_master WHERE type='table' AND name='reaction_messages'`
        )
        .get()

    if (!table['count(*)']) {
        // If the table does not exist, create it and setup the database
        sql.prepare(
            'CREATE TABLE reaction_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, channel_id TEXT, message_id TEXT)'
        ).run()
        sql.prepare(
            `CREATE UNIQUE INDEX idx_reaction_messages_id ON reaction_messages (id)`
        ).run()
        sql.prepare(
            `CREATE INDEX idx_reaction_messages_guild_id ON reaction_messages (guild_id)`
        ).run()
        sql.prepare(
            `CREATE INDEX idx_reaction_messages_channel_id ON reaction_messages (channel_id)`
        ).run()
        sql.prepare(
            `CREATE INDEX idx_reaction_messages_message_id ON reaction_messages (message_id)`
        ).run()

        sql.pragma('synchronous = 1')
        sql.pragma('journal_mode = wal')
    }

    return
}

const createVoiceStatesTable = async (client) => {
    // Check if the table voice_states exists
    const table = await sql
        .prepare(
            `SELECT count(*) FROM sqlite_master WHERE type='table' AND name='voice_states'`
        )
        .get()

    if (!table['count(*)']) {
        // If the table does not exist, create it and setup the database
        sql.prepare(
            'CREATE TABLE voice_states (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, channel_id TEXT, message_id TEXT)'
        ).run()
        sql.prepare(`CREATE UNIQUE INDEX idx_voice_states_id ON voice_states (id)`).run()
        sql.prepare(
            `CREATE INDEX idx_voice_states_guild_id ON voice_states (guild_id)`
        ).run()
        sql.prepare(
            `CREATE INDEX idx_voice_states_channel_id ON voice_states (channel_id)`
        ).run()
        sql.prepare(
            `CREATE INDEX idx_voice_states_message_id ON voice_states (message_id)`
        ).run()

        sql.pragma('synchronous = 1')
        sql.pragma('journal_mode = wal')
    }

    return
}

const createRolesTable = async (client) => {
    // Check if the table roles exists
    const table = await sql
        .prepare(`SELECT count(*) FROM sqlite_master WHERE type='table' AND name='roles'`)
        .get()

    if (!table['count(*)']) {
        // If the table does not exist, create it and setup the database
        sql.prepare(
            'CREATE TABLE roles (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, role_id TEXT, name TEXT, label TEXT)'
        ).run()
        sql.prepare(`CREATE UNIQUE INDEX idx_roles_id ON roles (id)`).run()
        sql.prepare(`CREATE INDEX idx_roles_guild_id ON roles (guild_id)`).run()
        sql.prepare(`CREATE INDEX idx_roles_role_id ON roles (role_id)`).run()
        sql.prepare(`CREATE INDEX idx_roles_name ON roles (name)`).run()
        sql.prepare(`CREATE INDEX idx_roles_label ON roles (label)`).run()

        sql.pragma('synchronous = 1')
        sql.pragma('journal_mode = wal')
    }

    return
}

createSelectMenusTable = async (client) => {
    // Check if the table select_menus exists
    const table = await sql
        .prepare(
            `SELECT count(*) FROM sqlite_master WHERE type='table' AND name='select_menus'`
        )
        .get()

    if (!table['count(*)']) {
        // If the table does not exist, create it and setup the database
        sql.prepare(
            'CREATE TABLE select_menus (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, channel_id TEXT, message_id TEXT)'
        ).run()
        sql.prepare(`CREATE UNIQUE INDEX idx_select_menus_id ON select_menus (id)`).run()
        sql.prepare(
            `CREATE INDEX idx_select_menus_guild_id ON select_menus (guild_id)`
        ).run()
        sql.prepare(
            `CREATE INDEX idx_select_menus_channel_id ON select_menus (channel_id)`
        ).run()
        sql.prepare(
            `CREATE INDEX idx_select_menus_message_id ON select_menus (message_id)`
        ).run()

        sql.pragma('synchronous = 1')
        sql.pragma('journal_mode = wal')
    }

    return
}
