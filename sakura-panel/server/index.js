
import express from "express";
import cors from "cors";
import "dotenv/config";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";

import {
  startBot,
  getBotStatus,
  getBotServers,
  getBotServer
} from "./bot.js";

import {
  getGuild,
  getGuilds,
  getGuildSettings,
  saveGuildSettings
} from "./database.js";

// ======================================
// CONFIG
// ======================================

const app = express();

const PORT = Number(process.env.PORT || 3001);

const FRONTEND_URL = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/$/, "");

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

const DISCORD_API = "https://discord.com/api/v10";

if (
  !DISCORD_CLIENT_ID ||
  !DISCORD_CLIENT_SECRET ||
  !DISCORD_REDIRECT_URI ||
  !SESSION_SECRET
) {
  throw new Error(
    "Missing environment variables: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, SESSION_SECRET"
  );
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ======================================
// MIDDLEWARE
// ======================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  session({
    name: "sakura.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "TOO_MANY_LOGIN_ATTEMPTS"
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "TOO_MANY_REQUESTS"
  }
});

app.use("/api", apiLimiter);

// ======================================
// HELPERS
// ======================================

function requireAuth(req, res, next) {
  if (!req.session?.discordUser) {
    return res.status(401).json({
      success: false,
      error: "NOT_LOGGED_IN"
    });
  }

  next();
}

function hasManagePermission(guild) {
  if (guild.owner === true) return true;

  try {
    const permissions = BigInt(guild.permissions || "0");

    const ADMINISTRATOR = 0x8n;
    const MANAGE_GUILD = 0x20n;

    return (
      (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
      (permissions & MANAGE_GUILD) === MANAGE_GUILD
    );
  } catch {
    return false;
  }
}

function createDiscordInviteUrl() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    scope: "bot applications.commands",
    permissions: "0"
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

function isValidServerId(id) {
  return /^\d{17,20}$/.test(id);
}

async function exchangeDiscordCode(code) {
  const body = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: DISCORD_REDIRECT_URI
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Discord token exchange failed:", data);
    throw new Error("DISCORD_TOKEN_EXCHANGE_FAILED");
  }

  return data;
}

async function refreshDiscordToken(req) {
  const refreshToken = req.session?.discordRefreshToken;

  if (!refreshToken) {
    throw new Error("DISCORD_SESSION_EXPIRED");
  }

  const body = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    delete req.session.discordAccessToken;
    delete req.session.discordRefreshToken;
    delete req.session.discordTokenExpiresAt;

    await new Promise((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    throw new Error("DISCORD_SESSION_EXPIRED");
  }

  req.session.discordAccessToken = data.access_token;
  req.session.discordRefreshToken = data.refresh_token;
  req.session.discordTokenExpiresAt =
    Date.now() + Number(data.expires_in || 0) * 1000;

  await new Promise((resolve, reject) => {
    req.session.save(err => {
      if (err) reject(err);
      else resolve();
    });
  });

  return data.access_token;
}

async function getDiscordAccessToken(req) {
  const token = req.session?.discordAccessToken;
  const expiresAt = Number(req.session?.discordTokenExpiresAt || 0);

  if (token && expiresAt > Date.now() + 60000) {
    return token;
  }

  return refreshDiscordToken(req);
}

async function getUserGuilds(req) {
  let token = await getDiscordAccessToken(req);

  let response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (response.status === 401) {
    token = await refreshDiscordToken(req);

    response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Discord guild request failed:", data);
    throw new Error("DISCORD_GUILD_REQUEST_FAILED");
  }

  return Array.isArray(data) ? data : [];
}

function findBotGuild(id) {
  return getBotServer(id) || null;
}

function findUserGuild(guilds, id) {
  return guilds.find(guild => guild.id === id) || null;
}

async function authorizeServer(req, serverId) {
  if (!isValidServerId(serverId)) {
    throw new Error("INVALID_SERVER_ID");
  }

  const guilds = await getUserGuilds(req);
  const guild = findUserGuild(guilds, serverId);

  if (!guild || !hasManagePermission(guild)) {
    throw new Error("MISSING_SERVER_PERMISSION");
  }

  const botGuild = findBotGuild(serverId);

  if (!botGuild) {
    throw new Error("BOT_NOT_IN_SERVER");
  }

  return { guild, botGuild };
}

function respondError(res, err) {
  const errors = {
    INVALID_SERVER_ID: 400,
    MISSING_SERVER_PERMISSION: 403,
    BOT_NOT_IN_SERVER: 404,
    DISCORD_SESSION_EXPIRED: 401,
    DISCORD_GUILD_REQUEST_FAILED: 502,
    DISCORD_TOKEN_EXCHANGE_FAILED: 502,
    DISCORD_USER_REQUEST_FAILED: 502
  };

  return res.status(errors[err.message] || 500).json({
    success: false,
    error: errors[err.message]
      ? err.message
      : "INTERNAL_SERVER_ERROR"
  });
}

// ======================================
// CONFIG
// ======================================

app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    inviteUrl: createDiscordInviteUrl()
  });
});

// ======================================
// DISCORD LOGIN
// ======================================

app.get("/auth/discord", loginLimiter, (req, res, next) => {
  const state = crypto.randomBytes(32).toString("hex");

  req.session.oauthState = state;

  req.session.save(err => {
    if (err) return next(err);

    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: DISCORD_REDIRECT_URI,
      response_type: "code",
      scope: "identify guilds",
      state
    });

    res.redirect(
      `https://discord.com/oauth2/authorize?${params.toString()}`
    );
  });
});

// ======================================
// DISCORD CALLBACK
// ======================================

app.get(
  "/auth/discord/callback",
  loginLimiter,
  async (req, res, next) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(
          `${FRONTEND_URL}/?error=DISCORD_LOGIN_CANCELLED`
        );
      }

      if (!code || !state || !req.session.oauthState) {
        return res.status(400).send("Invalid OAuth request.");
      }

      const received = Buffer.from(String(state));
      const saved = Buffer.from(String(req.session.oauthState));

      const valid =
        received.length === saved.length &&
        crypto.timingSafeEqual(received, saved);

      if (!valid) {
        return res.status(403).send("Invalid OAuth state.");
      }

      delete req.session.oauthState;

      const tokenData = await exchangeDiscordCode(String(code));

      const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        },
        cache: "no-store"
      });

      const user = await userResponse.json().catch(() => ({}));

      if (!userResponse.ok || !user.id) {
        throw new Error("DISCORD_USER_REQUEST_FAILED");
      }

      await new Promise((resolve, reject) => {
        req.session.regenerate(err => {
          if (err) reject(err);
          else resolve();
        });
      });

      req.session.discordUser = {
        id: user.id,
        username: user.username,
        global_name: user.global_name || null,
        avatar: user.avatar || null
      };

      req.session.discordAccessToken = tokenData.access_token;
      req.session.discordRefreshToken = tokenData.refresh_token;
      req.session.discordTokenExpiresAt =
        Date.now() + Number(tokenData.expires_in || 0) * 1000;

      await new Promise((resolve, reject) => {
        req.session.save(err => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.redirect(FRONTEND_URL);

    } catch (err) {
      next(err);
    }
  }
);

// ======================================
// AUTH STATUS
// ======================================

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    user: req.session.discordUser
  });
});

// ======================================
// LOGOUT
// ======================================

app.post("/api/auth/logout", (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);

    res.clearCookie("sakura.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });

    res.json({
      success: true,
      message: "LOGGED_OUT"
    });
  });
});

// ======================================
// BOT STATUS
// ======================================

app.get("/api/bot/status", requireAuth, (req, res) => {
  res.json({
    success: true,
    bot: getBotStatus()
  });
});

app.get("/api/status", requireAuth, (req, res) => {
  res.json({
    success: true,
    bot: getBotStatus()
  });
});

app.get("/api/bot/info", requireAuth, (req, res) => {
  res.json({
    success: true,
    bot: getBotStatus()
  });
});

// ======================================
// SERVER LIST
// ======================================

app.get("/api/servers", requireAuth, async (req, res, next) => {
  try {
    const userGuilds = await getUserGuilds(req);

    const manageable = userGuilds.filter(hasManagePermission);
    const botGuilds = getBotServers();

    const botIds = new Set(botGuilds.map(g => g.id));

    const servers = manageable.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon || null,
      owner: guild.owner === true,
      botAdded: botIds.has(guild.id),
      memberCount:
        botGuilds.find(b => b.id === guild.id)?.memberCount ?? null
    }));

    res.json({
      success: true,
      servers
    });

  } catch (err) {
    next(err);
  }
});

// ======================================
// SELECT SERVER
// ======================================

app.post(
  "/api/servers/:id/select",
  requireAuth,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const { guild, botGuild } = await authorizeServer(req, id);

      req.session.selectedServerId = id;

      await new Promise((resolve, reject) => {
        req.session.save(err => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        success: true,
        message: "SERVER_SELECTED",
        server: {
          id: guild.id,
          name: guild.name,
          icon: guild.icon || null,
          owner: guild.owner === true,
          botAdded: true
        }
      });

    } catch (err) {
      if (err.message === "MISSING_SERVER_PERMISSION" ||
          err.message === "BOT_NOT_IN_SERVER" ||
          err.message === "INVALID_SERVER_ID") {
        return respondError(res, err);
      }

      next(err);
    }
  }
);

// ======================================
// SERVER DETAILS
// ======================================

app.get(
  "/api/servers/:id",
  requireAuth,
  async (req, res, next) => {
    try {
      const { guild, botGuild } =
        await authorizeServer(req, req.params.id);

      res.json({
        success: true,
        server: {
          ...botGuild,
          owner: guild.owner === true,
          botAdded: true
        }
      });

    } catch (err) {
      if ([
        "INVALID_SERVER_ID",
        "MISSING_SERVER_PERMISSION",
        "BOT_NOT_IN_SERVER"
      ].includes(err.message)) {
        return respondError(res, err);
      }

      next(err);
    }
  }
);

// ======================================
// SERVER SETTINGS - READ
// ======================================

app.get(
  "/api/servers/:id/settings",
  requireAuth,
  async (req, res, next) => {
    try {
      await authorizeServer(req, req.params.id);

      const settings = getGuildSettings.get(req.params.id);

      res.json({
        success: true,
        settings: settings || {
          guild_id: req.params.id,
          prefix: "!",
          welcome_enabled: 0,
          welcome_message: "Welcome!",
          log_channel: null
        }
      });

    } catch (err) {
      if ([
        "INVALID_SERVER_ID",
        "MISSING_SERVER_PERMISSION",
        "BOT_NOT_IN_SERVER"
      ].includes(err.message)) {
        return respondError(res, err);
      }

      next(err);
    }
  }
);

// ======================================
// SERVER SETTINGS - SAVE
// ======================================

app.put(
  "/api/servers/:id/settings",
  requireAuth,
  async (req, res, next) => {
    try {
      const id = req.params.id;

      await authorizeServer(req, id);

      const {
        prefix,
        welcome_enabled,
        welcome_message,
        log_channel
      } = req.body || {};

      if (
        typeof prefix !== "string" ||
        prefix.length < 1 ||
        prefix.length > 5
      ) {
        return res.status(400).json({
          success: false,
          error: "INVALID_PREFIX"
        });
      }

      if (typeof welcome_enabled !== "boolean") {
        return res.status(400).json({
          success: false,
          error: "INVALID_WELCOME_ENABLED"
        });
      }

      if (
        typeof welcome_message !== "string" ||
        welcome_message.length > 1000
      ) {
        return res.status(400).json({
          success: false,
          error: "INVALID_WELCOME_MESSAGE"
        });
      }

      if (
        log_channel !== null &&
        log_channel !== undefined &&
        log_channel !== "" &&
        (
          typeof log_channel !== "string" ||
          !isValidServerId(log_channel)
        )
      ) {
        return res.status(400).json({
          success: false,
          error: "INVALID_LOG_CHANNEL"
        });
      }

      // Ensure the guild exists in SQLite.
      if (!getGuild.get(id)) {
        return res.status(409).json({
          success: false,
          error: "GUILD_NOT_SYNCED_TO_DATABASE"
        });
      }

      saveGuildSettings.run({
        guild_id: id,
        prefix,
        welcome_enabled: welcome_enabled ? 1 : 0,
        welcome_message,
        log_channel: log_channel || null
      });

      res.json({
        success: true,
        message: "SETTINGS_SAVED",
        settings: getGuildSettings.get(id)
      });

    } catch (err) {
      if ([
        "INVALID_SERVER_ID",
        "MISSING_SERVER_PERMISSION",
        "BOT_NOT_IN_SERVER"
      ].includes(err.message)) {
        return respondError(res, err);
      }

      next(err);
    }
  }
);

// ======================================
// DATABASE STATUS
// ======================================

app.get("/api/database/status", requireAuth, (req, res) => {
  res.json({
    success: true,
    database: {
      connected: true,
      guildCount: getGuilds.all().length
    }
  });
});

// ======================================
// ROOT
// ======================================

app.get("/", (req, res) => {
  res.json({
    name: "SAKURA PANEL",
    status: "online",
    version: "1.0.0"
  });
});

// ======================================
// ERROR HANDLER
// ======================================

app.use((err, req, res, next) => {
  console.error("[SAKURA API ERROR]", err);

  if (res.headersSent) {
    return next(err);
  }

  const knownErrors = {
    DISCORD_SESSION_EXPIRED: {
      status: 401,
      message: "DISCORD_SESSION_EXPIRED"
    },
    DISCORD_GUILD_REQUEST_FAILED: {
      status: 502,
      message: "DISCORD_GUILD_REQUEST_FAILED"
    },
    DISCORD_TOKEN_EXCHANGE_FAILED: {
      status: 502,
      message: "DISCORD_TOKEN_EXCHANGE_FAILED"
    },
    DISCORD_USER_REQUEST_FAILED: {
      status: 502,
      message: "DISCORD_USER_REQUEST_FAILED"
    }
  };

  const known = knownErrors[err.message];

  res.status(known?.status || 500).json({
    success: false,
    error: known?.message || "INTERNAL_SERVER_ERROR"
  });
});

// ======================================
// START SERVER
// ======================================

const server = app.listen(PORT, () => {
  console.log("================================");
  console.log("SAKURA PANEL API");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("Status: ONLINE");
  console.log("================================");
});

startBot().catch(err => {
  console.error("[SAKURA BOT START ERROR]", err);
});

export default app;
