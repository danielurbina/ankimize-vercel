// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  articles;
  questions;
  userQuestions;
  userProgress;
  currentUserId;
  currentArticleId;
  currentQuestionId;
  currentUserQuestionId;
  currentUserProgressId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.articles = /* @__PURE__ */ new Map();
    this.questions = /* @__PURE__ */ new Map();
    this.userQuestions = /* @__PURE__ */ new Map();
    this.userProgress = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentArticleId = 1;
    this.currentQuestionId = 1;
    this.currentUserQuestionId = 1;
    this.currentUserProgressId = 1;
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // Article methods
  async getArticles() {
    return Array.from(this.articles.values());
  }
  async getArticle(id) {
    return this.articles.get(id);
  }
  async createArticle(insertArticle) {
    const id = this.currentArticleId++;
    const article = {
      ...insertArticle,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.articles.set(id, article);
    return article;
  }
  // Question methods
  async getQuestions(articleId) {
    return Array.from(this.questions.values()).filter(
      (question) => question.articleId === articleId
    );
  }
  async getQuestion(id) {
    return this.questions.get(id);
  }
  async createQuestion(insertQuestion) {
    const id = this.currentQuestionId++;
    const question = {
      ...insertQuestion,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.questions.set(id, question);
    return question;
  }
  // UserQuestion methods
  async getUserQuestions(userId) {
    return Array.from(this.userQuestions.values()).filter(
      (userQuestion) => userQuestion.userId === userId
    );
  }
  async getUserQuestionsByStatus(userId, status) {
    return Array.from(this.userQuestions.values()).filter(
      (userQuestion) => userQuestion.userId === userId && userQuestion.status === status
    );
  }
  async getUserQuestionsForReview(userId) {
    const now = /* @__PURE__ */ new Date();
    return Array.from(this.userQuestions.values()).filter(
      (userQuestion) => {
        return userQuestion.userId === userId && userQuestion.nextReview <= now;
      }
    );
  }
  async createUserQuestion(insertUserQuestion) {
    const id = this.currentUserQuestionId++;
    const userQuestion = {
      ...insertUserQuestion,
      id,
      reviewCount: 0,
      lastReviewed: /* @__PURE__ */ new Date()
    };
    this.userQuestions.set(id, userQuestion);
    return userQuestion;
  }
  async updateUserQuestion(id, userQuestionUpdate) {
    const existing = this.userQuestions.get(id);
    if (!existing) {
      throw new Error(`UserQuestion with id ${id} not found`);
    }
    const updated = { ...existing, ...userQuestionUpdate };
    this.userQuestions.set(id, updated);
    return updated;
  }
  // UserProgress methods
  async getUserProgress(userId, articleId) {
    return Array.from(this.userProgress.values()).find(
      (progress) => progress.userId === userId && progress.articleId === articleId
    );
  }
  async createUserProgress(insertUserProgress) {
    const id = this.currentUserProgressId++;
    const userProgress2 = {
      ...insertUserProgress,
      id,
      lastStudied: /* @__PURE__ */ new Date()
    };
    this.userProgress.set(id, userProgress2);
    return userProgress2;
  }
  async updateUserProgress(id, userProgressUpdate) {
    const existing = this.userProgress.get(id);
    if (!existing) {
      throw new Error(`UserProgress with id ${id} not found`);
    }
    const updated = {
      ...existing,
      ...userProgressUpdate,
      lastStudied: /* @__PURE__ */ new Date()
    };
    this.userProgress.set(id, updated);
    return updated;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertArticleSchema = createInsertSchema(articles).pick({
  title: true,
  content: true,
  source: true
});
var questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  paragraphText: text("paragraph_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertQuestionSchema = createInsertSchema(questions).pick({
  articleId: true,
  question: true,
  answer: true,
  paragraphText: true
});
var userQuestions = pgTable("user_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  status: text("status").notNull(),
  // "new", "learning", "reviewing", "mastered"
  easeFactor: integer("ease_factor").default(250).notNull(),
  // For SM-2 algorithm
  interval: integer("interval").default(0).notNull(),
  // Days until next review
  nextReview: timestamp("next_review").defaultNow().notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  lastReviewed: timestamp("last_reviewed").defaultNow().notNull()
});
var insertUserQuestionSchema = createInsertSchema(userQuestions).pick({
  userId: true,
  questionId: true,
  status: true,
  easeFactor: true,
  interval: true,
  nextReview: true
});
var userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  articleId: integer("article_id").notNull(),
  questionsCompleted: integer("questions_completed").default(0).notNull(),
  questionsTotal: integer("questions_total").default(0).notNull(),
  lastStudied: timestamp("last_studied").defaultNow().notNull()
});
var insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  articleId: true,
  questionsCompleted: true,
  questionsTotal: true
});

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(userData);
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/articles", async (_req, res) => {
    try {
      const articles2 = await storage.getArticles();
      res.json(articles2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/articles", async (req, res) => {
    try {
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/articles/:articleId/questions", async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const questions2 = await storage.getQuestions(articleId);
      res.json(questions2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/articles/:articleId/questions", async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        articleId
      });
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/questions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const userQuestions2 = await storage.getUserQuestions(userId);
      res.json(userQuestions2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/review", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const userQuestions2 = await storage.getUserQuestionsForReview(userId);
      const reviewItems = await Promise.all(
        userQuestions2.map(async (uq) => {
          const question = await storage.getQuestion(uq.questionId);
          return {
            userQuestion: uq,
            question
          };
        })
      );
      res.json(reviewItems);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/questions/:questionId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const questionId = parseInt(req.params.questionId);
      const user = await storage.getUser(userId);
      const question = await storage.getQuestion(questionId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      const userQuestionData = insertUserQuestionSchema.parse({
        userId,
        questionId,
        status: "new",
        easeFactor: 250,
        interval: 0,
        nextReview: /* @__PURE__ */ new Date()
      });
      const userQuestion = await storage.createUserQuestion(userQuestionData);
      res.status(201).json(userQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/user-questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, easeFactor, interval, nextReview } = req.body;
      const userQuestion = await storage.updateUserQuestion(id, {
        status,
        easeFactor,
        interval,
        nextReview: nextReview ? new Date(nextReview) : void 0,
        reviewCount: req.body.reviewCount,
        lastReviewed: /* @__PURE__ */ new Date()
      });
      res.json(userQuestion);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/progress/:articleId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const articleId = parseInt(req.params.articleId);
      const userProgress2 = await storage.getUserProgress(userId, articleId);
      if (!userProgress2) {
        return res.status(404).json({ message: "Progress not found" });
      }
      res.json(userProgress2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const progressData = insertUserProgressSchema.parse({
        ...req.body,
        userId
      });
      const userProgress2 = await storage.createUserProgress(progressData);
      res.status(201).json(userProgress2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/user-progress/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { questionsCompleted, questionsTotal } = req.body;
      const userProgress2 = await storage.updateUserProgress(id, {
        questionsCompleted,
        questionsTotal
      });
      res.json(userProgress2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
