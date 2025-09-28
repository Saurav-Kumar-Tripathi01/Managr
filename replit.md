# Managr Discord Bot

## Overview
Managr is a comprehensive Discord bot providing multiple features including economy, music, games, moderation, and utility commands. This is a Node.js Discord bot project that has been successfully set up to run in the Replit environment.

## Project Status
- **Status**: Successfully imported and running ✅
- **Bot Name**: Manager#9748
- **Language**: Node.js
- **Database**: SQLite (better-sqlite3)
- **Import Date**: September 28, 2025

## Setup Completed
- ✅ All dependencies installed (discord.js, better-sqlite3, axios, html-entities, etc.)
- ✅ Environment variables configured (TOKEN, CLIENT_ID, GUILD_ID, YOUTUBE_COOKIE)
- ✅ Workflow configured and running
- ✅ Database tables initialized
- ✅ Bot successfully connected to Discord

## Project Architecture

### Main Files
- `index.js` - Main bot entry point with database setup and event/command loading
- `deploy-commands.js` - Script to deploy slash commands to Discord
- `bot.db` - SQLite database file
- `shopItems.js` - Economy shop items configuration

### Directory Structure
- `commands/` - Bot slash commands organized by category
  - `economy/` - Balance, daily rewards, shop, inventory, leaderboard
  - `fun/` - Memes, tic-tac-toe games
  - `games/` - Rock-paper-scissors, trivia
  - `moderation/` - Clear, kick, warn, warnings management
  - `music/` - Play, skip, stop music commands
  - `utility/` - Help, info, ping, rank, server info, settings
- `events/` - Discord.js event handlers
- `utils/` - Utility functions (logger)

### Features
- **Economy System**: Virtual currency, daily rewards, shop, inventory
- **Music System**: YouTube music playback with voice channel support
- **Games**: Trivia, Rock-Paper-Scissors, Tic-Tac-Toe
- **Moderation**: Warning system, kick, message clearing
- **Leveling System**: XP and level tracking
- **Utility Commands**: Server info, user info, avatar display

### Database Schema
- `warnings` - User warning system
- `settings` - Server-specific settings (welcome/goodbye channels, logging)
- `levels` - User XP and level tracking
- `economy` - User balance and daily reward tracking
- `inventories` - User item ownership

## Workflow Configuration
- **Name**: Discord Bot
- **Command**: `node index.js`
- **Output**: Console
- **Status**: Running ✅

## Dependencies Installed
Core dependencies:
- `discord.js` - Discord API wrapper
- `better-sqlite3` - SQLite database
- `axios` - HTTP requests
- `html-entities` - HTML entity decoding
- `dotenv` - Environment variable management
- `play-dl` - YouTube music streaming
- `dayjs` - Date manipulation

Dev dependencies:
- `nodemon` - Development server

## Recent Changes
- September 28, 2025: Successfully imported from GitHub and set up in Replit environment
- Installed missing dependencies: better-sqlite3, axios, html-entities
- Configured workflow for continuous bot operation
- Bot is now online and ready for use

## User Preferences
- Clean, organized code structure maintained
- All original functionality preserved
- Secure secret management using Replit's environment variables