export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    this.registry.set("gameTitle", "# Startup Sprint 🏃💻");
    this.registry.set("gameSubtitle", "A 2D Humorous YC Founder Simulator");

    if (!this.registry.has("playerName")) this.registry.set("playerName", "Founder");
    this.registry.set("week", 1);
    this.registry.set("weeksTotal", 12);

    // Track which NPCs were talked to this week
    this.registry.set("npcTalkedThisWeek", {});
    this.registry.set("npcQuestionProgress", {});
    this.registry.set("interactionsThisWeek", 0);
    this.registry.set("maxInteractionsPerWeek", 2);
    this.registry.set("weeklyNpcLimit",2)

    // Stats
    this.registry.set("Funds", 50000);
    this.registry.set("Product", 20);
    this.registry.set("Morale", 70);
    this.registry.set("Hype", 10);

    // --- simple textures ---
    const g = this.add.graphics();
    g.fillStyle(0x1a2038, 1).fillRect(0,0,64,64);
    g.fillStyle(0x1d2541, 1).fillRect(0,0,32,32).fillRect(32,32,32,32);
    g.generateTexture("floor64", 64, 64).clear();

    g.fillStyle(0x404a78, 1).fillRect(0,0,360,60);
    g.lineStyle(2,0x2c3966,1).strokeRect(0,0,360,60);
    g.generateTexture("platform", 360, 60).clear();

    g.fillStyle(0x7a4b27, 1).fillRect(0,0,120,60);
    g.lineStyle(2,0x5a371c,1).strokeRect(0,0,120,60);
    g.generateTexture("desk", 120, 60).clear();

    g.fillStyle(0x2c6b6f,1).fillRect(0,0,40,40);
    g.lineStyle(2,0x1e4a4d,1).strokeRect(0,0,40,40);
    g.generateTexture("chair",40,40).clear();

    g.destroy();

    this.load.spritesheet("characters", "assets/player_universal.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("npc_paul", "assets/paul_universal.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("npc_ava", "assets/Ava_universal.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("npc_max", "assets/CTO_universal.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("npc_liam", "assets/intern_universal.png", { frameWidth: 64, frameHeight: 64 });
  }

  create() { this.scene.start("MenuScene"); }
}
