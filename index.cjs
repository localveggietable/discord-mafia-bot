require("dotenv").config();
const {Client, Collection, Intents} = require("discord.js");
const express = require("express");




// Code down below

const bot = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

console.log(process.env.DISCORD_TOKEN);




bot.login(process.env.DISCORD_TOKEN);