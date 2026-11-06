
import {
  Client,
  GatewayIntentBits,
  Partials
} from "discord.js";

import {
  saveGuild
} from "./database.js";

// =================================
// SAKURA PANEL BOT SYSTEM
// =================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN missing in .env");
}

// =================================
// DISCORD CLIENT
// =================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.GuildMember,
    Partials.User
  ]
});

// =================================
// BOT STATUS
// =================================

let botReady = false;
let startedAt = null;
let lastError = null;
let loginPromise = null;

// =================================
// DATABASE SYNC
// =================================

function syncGuildToDatabase(guild) {
  try {
    saveGuild.run({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({
        size: 128,
        extension: "png"
      }),
      owner_id: guild.ownerId
    });

    console.log(`[DATABASE] Saved: ${guild.name}`);
  } catch (error) {
    console.error("[DATABASE ERROR]", error);
  }
}

function syncAllGuilds() {
  if (!client.isReady()) return;

  for (const guild of client.guilds.cache.values()) {
    syncGuildToDatabase(guild);
  }

  console.log(
    `[DATABASE] Synced ${client.guilds.cache.size} servers`
  );
}

// =================================
// BOT EVENTS
// =================================

client.once("clientReady", () => {
  botReady = true;
  startedAt = new Date();
  lastError = null;

  console.log("================================");
  console.log("SAKURA DISCORD BOT");
  console.log(`Bot: ${client.user.tag}`);
  console.log(`ID: ${client.user.id}`);
  console.log(`Servers: ${client.guilds.cache.size}`);
  console.log("Status: ONLINE");
  console.log("================================");

  syncAllGuilds();
});

client.on("guildCreate", (guild) => {
  console.log(`Joined server: ${guild.name}`);
  syncGuildToDatabase(guild);
});

client.on("guildUpdate", (oldGuild, newGuild) => {
  syncGuildToDatabase(newGuild);
});

client.on("guildDelete", (guild) => {
  console.log(`Left server: ${guild.name}`);
});

client.on("error", (error) => {
  lastError = error.message;
  console.error("Discord Client Error:", error);
});

client.on("shardDisconnect", () => {
  botReady = false;
  console.warn("Discord Gateway disconnected");
});

client.on("shardReconnecting", () => {
  botReady = false;
  console.warn("Discord Gateway reconnecting...");
});

client.on("shardResume", () => {
  botReady = client.isReady();
  console.log("Discord Gateway resumed");

  if (botReady) syncAllGuilds();
});

client.on("shardError", (error) => {
  lastError = error.message;
  botReady = false;
  console.error("Discord Shard Error:", error);
});

// =================================
// START BOT
// =================================

export function startBot() {
  if (loginPromise) return loginPromise;

  loginPromise = (async () => {
    try {
      await client.login(TOKEN);

      if (!client.isReady()) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Discord Bot ready timeout"));
          }, 30000);

          const onReady = () => {
            cleanup();
            resolve();
          };

          const cleanup = () => {
            clearTimeout(timeout);
            client.off("clientReady", onReady);
          };

          client.once("clientReady", onReady);

          if (client.isReady()) {
            onReady();
          }
        });
      }

      if (!client.isReady()) {
        throw new Error("Discord Bot is not ready");
      }

      botReady = true;
      lastError = null;

      syncAllGuilds();

      return client.user;

    } catch (error) {
      botReady = false;
      lastError = error.message;
      loginPromise = null;

      client.destroy();

      throw error;
    }
  })();

  return loginPromise;
}

// =================================
// BOT INFORMATION
// =================================

export function getBotStatus() {
  const online = botReady && client.isReady();

  return {
    online,
    status: online ? "online" : "offline",
    username: client.user?.username ?? null,
    tag: client.user?.tag ?? null,
    id: client.user?.id ?? null,
    avatar: client.user?.displayAvatarURL() ?? null,
    serverCount: client.guilds.cache.size,
    uptime: online ? (client.uptime ?? 0) : 0,
    startedAt: startedAt?.toISOString() ?? null,
    lastError
  };
}

// =================================
// SERVER LIST
// =================================

export function getBotServers() {
  if (!client.isReady()) return [];

  return client.guilds.cache.map((guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({
      size: 128,
      extension: "png"
    }),
    memberCount: guild.memberCount,
    ownerId: guild.ownerId
  }));
}

// =================================
// GET SINGLE SERVER
// =================================

export function getBotServer(serverId) {
  if (!client.isReady()) return null;

  if (!/^\d{17,20}$/.test(serverId)) {
    return null;
  }

  const guild = client.guilds.cache.get(serverId);

  if (!guild) return null;

  return {
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({
      size: 128,
      extension: "png"
    }),
    memberCount: guild.memberCount,
    ownerId: guild.ownerId,
    createdAt: guild.createdAt.toISOString()
  };
}

// =================================
// SHUTDOWN
// =================================

export async function stopBot() {
  botReady = false;
  loginPromise = null;

  if (client.isReady()) {
    console.log("Stopping Sakura Discord Bot...");
  }

  client.destroy();

  console.log("Sakura Discord Bot stopped");
}

export default client;
