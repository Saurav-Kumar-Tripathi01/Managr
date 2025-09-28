// Require necessary discord.js classes
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const Database = require("better-sqlite3");
const play = require("play-dl");

if (process.env.YOUTUBE_COOKIE && process.env.YOUTUBE_COOKIE.length > 0) {
    // Check if cookie exists
    play.setToken({
        youtube: {
            cookie: process.env.YOUTUBE_COOKIE,
        },
    });
    console.log("✅ YouTube cookie loaded into play-dl.");
} else {
    console.warn(
        "⚠️ No YouTube cookie found in .env. Music playback may be unstable or fail.",
    );
}

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

//maps for the ability to save music
client.queues = new Map();

// Initialize the database
const db = new Database("bot.db", { verbose: console.log });
client.db = db; // Attach the database to the client object

// Create the warnings table if it doesn't exist
const createTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    moderatorId TEXT NOT NULL,
    reason TEXT,
    timestamp INTEGER NOT NULL
  );
`);
createTable.run();

// Create the settings table
const createSettingsTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
        guildId TEXT PRIMARY KEY,
        welcomeChannelId TEXT
    );
`);
createSettingsTable.run();

const createLevelsTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS levels (
        userId TEXT NOT NULL,
        guildId TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        PRIMARY KEY (userId, guildId)
    );
`);
createLevelsTable.run();

// Create the economy table
const createEconomyTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS economy (
        userId TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        lastDaily INTEGER DEFAULT 0
    );
`);
createEconomyTable.run();

// Create the inventories table
const createInventoriesTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS inventories (
        userId TEXT NOT NULL,
        guildId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        PRIMARY KEY (userId, guildId, itemId)
    );
`);
createInventoriesTable.run();

// Add the logChannelId column to the settings table if it doesn't exist
try {
    db.prepare("ALTER TABLE settings ADD COLUMN logChannelId TEXT").run();
} catch (error) {
    if (error.message.includes("duplicate column name")) {
        // This is expected if the bot has been run before, so we can ignore it.
    } else {
        // Throw any other errors
        throw error;
    }
}

try {
    db.prepare("ALTER TABLE settings ADD COLUMN goodbyeChannelId TEXT").run();
} catch (error) {
    if (!error.message.includes("duplicate column name")) throw error;
}

console.log("✅ Database connected and tables are ready.");

// --- COMMAND HANDLING ---
client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
            );
        }
    }
}

// --- EVENT HANDLING ---
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
    res.send("Bot is alive!");
});

app.listen(port, () => {
    console.log(`✅ Keep-alive server listening on port ${port}`);
});

// Log in to Discord with your client's token
client.login(process.env.TOKEN);