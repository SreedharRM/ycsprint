export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    this.registry.set("gameTitle", "Startup Sprint 🏃💻");
    this.registry.set("gameSubtitle", "A 2D Humorous YC Founder Simulator");

    if (!this.registry.has("playerName")) this.registry.set("playerName", "Founder");
    this.registry.set("week", 1);
    this.registry.set("weeksTotal", 12);

    // Track which NPCs were talked to this week
    this.registry.set("npcTalkedThisWeek", {});
    this.registry.set("npcQuestionProgress", {});
    this.registry.set("interactionsThisWeek", 0);
    this.registry.set("maxInteractionsPerWeek", 2);
    this.registry.set("weeklyNpcLimit", 2);

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

    g.fillStyle(0x996633, 1).fillRect(0, 0, 32, 32);
    g.generateTexture("trash", 32, 32).clear();


    g.destroy();

    const g2 = this.add.graphics();
    // server floor (darker grid)
    g2.fillStyle(0x151a2a, 1).fillRect(0,0,64,64);
    g2.fillStyle(0x111522, 1).fillRect(0,0,32,32).fillRect(32,32,32,32);
    g2.generateTexture("server_floor64", 64, 64).clear();

    // server rack (simple)
    g2.fillStyle(0x222833, 1).fillRoundedRect(0,0,56,96,6);
    g2.lineStyle(2,0x0f1117,1).strokeRoundedRect(0,0,56,96,6);
    // vent lines
    g2.lineStyle(1,0x55627a,1);
    for (let i=8;i<88;i+=10) g2.strokeLineShape(new Phaser.Geom.Line(6,i,50,i));
    g2.generateTexture("server_rack", 56, 96).clear();

    g2.fillStyle(0x000000, 1).fillRect(0, 0, 16, 16);
    g2.generateTexture("blackWall", 16, 16).clear();

    // optional door visual
    g2.fillStyle(0x3a8f8a, 1).fillRoundedRect(0,0,36,64,8);
    g2.lineStyle(2,0x1c4a47,1).strokeRoundedRect(0,0,36,64,8);
    g2.generateTexture("door", 36, 64).clear();

    g2.destroy();

    const gb = this.add.graphics();
    gb.fillStyle(0x000000, 1).fillCircle(8, 8, 8); // black bug body
    gb.fillStyle(0xff0000, 1).fillCircle(8, 8, 4); // red head
    gb.generateTexture("bug", 16, 16);
    gb.destroy();

    // --- spritesheets ---
    this.load.spritesheet("characters", "assets/player.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("npc_paul", "assets/paul_universal.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("npc_ava", "assets/Ava_universal.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("npc_max", "assets/CTO_universal.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("npc_liam", "assets/intern_universal.png", { frameWidth: 64, frameHeight: 64 });
    this.load.image("founder1", "assets/founder1.png");
    this.load.image("founder2", "assets/founder2.png");
    this.load.image("founder3", "assets/founder3.png");
    this.load.image("founder4", "assets/founder4.png");
    this.load.image("trash_paper", "assets/paper.png");

  }

  create() { 
    this.scene.start("MenuScene"); 
  }
}
