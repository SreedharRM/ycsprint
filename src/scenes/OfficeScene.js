// src/scenes/OfficeScene.js
import DialogBox from "../ui/DialogBox.js";
import ChoiceMenu from "../ui/ChoiceMenu.js";

export default class OfficeScene extends Phaser.Scene {
  constructor() {
    super("OfficeScene");
  }

  
  create() {
    // ----- World & background -----
    this.room = { width: this.scale.width, height: this.scale.height };
    this.physics.world.setBounds(0, 0, this.room.width, this.room.height);
    this.cameras.main.setBounds(0, 0, this.room.width, this.room.height);

    this.floor = this.add
      .tileSprite(0, 0, this.room.width, this.room.height, "floor64")
      .setOrigin(0, 0);

    // ----- Minimal furniture -----
    this.solids = this.physics.add.staticGroup();
    const cx = Math.round(this.room.width * 0.5);
    const cy = Math.round(this.room.height * 0.55);


    // 2) Desk centered, on top of platform
    //    Give it a tighter collider so you can get close without "invisible wall"
    const desk = this.physics.add.staticImage(cx, cy, "desk")
      .setOrigin(0.5, 0.5)
      .setDepth(10);

    // Optional: shrink collision bounds a bit (tune to your sprite)
    // Example: 80% width, 60% height
    desk.body.setSize(desk.width * 0.8, desk.height * 0.6).setOffset(
      (desk.width - desk.width * 0.8) / 2,
      (desk.height - desk.height * 0.6) / 2
    );


    // Add to solids for consistency (not strictly needed since already staticImages)
    this.solids.add(desk);


    this.founders = [
      {
        name: "Jared Friedman",
        imageKey: "founder1", // preload this in load()
        tips: [
          { condition: stats => stats.Funds < 2000, text: "Cash is running low — speak to the investor about quick funding." },
          { condition: stats => stats.Product < 40, text: "Your product needs work — talk to your lead developer." },
          { condition: stats => stats.Morale < 40, text: "Team morale is shaky — check in with HR." },
          { condition: stats => stats.Hype < 40, text: "No one’s talking about your startup — meet with marketing." },
          { condition: () => true, text: "You’re doing fine — keep pushing forward." }
        ]
      },
      {
        name: "Garry Tan",
        imageKey: "founder2",
        tips: [
          { condition: stats => stats.Funds < 2000, text: "Money dries up faster than you think — talk to your CFO." },
          { condition: stats => stats.Product < 40, text: "Your tech isn’t impressive yet — work closely with engineering." },
          { condition: stats => stats.Morale < 40, text: "Low morale will kill you — have a team lunch." },
          { condition: stats => stats.Hype < 40, text: "Without hype, you’ll be forgotten — speak with PR." },
          { condition: () => true, text: "Everything looks good — keep executing." }
        ]
      },
      {
        name: "Michael Seibel",
        imageKey: "founder3",
        tips: [
          { condition: stats => stats.Funds < 2000, text: "You might run out of cash — talk to the bank." },
          { condition: stats => stats.Product < 40, text: "Polish your product — work with QA." },
          { condition: stats => stats.Morale < 40, text: "Burnout risk — give your team a break." },
          { condition: stats => stats.Hype < 40, text: "Nobody knows you — arrange a press release." },
          { condition: () => true, text: "You’re on track — maintain momentum." }
        ]
      },
      {
        name: "Paul Graham",
        imageKey: "founder4",
        tips: [
          { condition: stats => stats.Funds < 2000, text: "Funds are too low — reach out to angel investors." },
          { condition: stats => stats.Product < 40, text: "Product’s too rough — hold a sprint review." },
          { condition: stats => stats.Morale < 40, text: "Team morale dip — give recognition awards." },
          { condition: stats => stats.Hype < 40, text: "Hype is cold — plan a launch event." },
          { condition: () => true, text: "Strong position — prepare for scaling." }
        ]
      }
    ];

    // Rebuild/refresh static bodies so Arcade Physics locks them in
    desk.refreshBody();

    // ----- Player -----
    this.anims.create({
      key: "walk-up",
      frames: this.anims.generateFrameNumbers("characters", { start: 2, end: 9 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "walk-left",
      frames: this.anims.generateFrameNumbers("characters", { start: 13, end: 20 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "walk-down",
      frames: this.anims.generateFrameNumbers("characters", { start: 24, end: 31 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("characters", { start: 34, end: 43 }),
      frameRate: 8,
      repeat: -1
    });

    // Idle frames
    this.anims.create({ key: "idle-down", frames: [{ key: "characters", frame: 23 }], frameRate: 1 });
    this.anims.create({ key: "idle-left", frames: [{ key: "characters", frame: 13 }], frameRate: 1 });
    this.anims.create({ key: "idle-right", frames: [{ key: "characters", frame: 33 }], frameRate: 1 });
    this.anims.create({ key: "idle-up", frames: [{ key: "characters", frame: 23 }], frameRate: 1 });

    this.player = this.physics.add
      .sprite(cx - 180, cy + 40, "characters", 0)
      .setCollideWorldBounds(true);
    this.player.anims.play("idle-down");
    this.physics.add.collider(this.player, this.solids);

    const playerName = this.registry.get("playerName") || "Founder";
    this.nameText = this.add
      .text(this.player.x, this.player.y - 40, playerName, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: { left: 4, right: 4, top: 2, bottom: 2 }
      })
      .setOrigin(0.5);

    this.registry.events.on("changedata-playerName", (_p, v) =>
      this.nameText.setText(String(v || "Founder"))
    );

    // ----- Weekly limits -----
    this.maxInteractions = this.registry.get("maxInteractionsPerWeek") || 2;
    this.weeklyNpcLimit = this.registry.get("weeklyNpcLimit") || 2;
    this.interactionsThisWeek = this.registry.get("interactionsThisWeek") || 0;
    this.npcTalkedThisWeek = this.registry.get("npcTalkedThisWeek") || {};
    this.npcQuestionProgress = this.registry.get("npcQuestionProgress") || {};

    // ----- NPCs (with branching choices) -----
    this.npcs = this.buildNpcList(cx, cy, playerName);

    // Sprites, labels, zones
    this.interactZones = [];
    this.npcSprites = [];
    function createNpcAnimations(scene, key) {
      scene.anims.create({
        key: `${key}_walk-down`,
        frames: scene.anims.generateFrameNumbers(key, { start: 23, end: 32 }),
        frameRate: 8,
        repeat: -1
      });
      scene.anims.create({
        key: `${key}_walk-left`,
        frames: scene.anims.generateFrameNumbers(key, { start: 12, end: 21 }),
        frameRate: 8,
        repeat: -1
      });
      scene.anims.create({
        key: `${key}_walk-right`,
        frames: scene.anims.generateFrameNumbers(key, { start: 34, end: 43 }),
        frameRate: 8,
        repeat: -1
      });
      scene.anims.create({
        key: `${key}_walk-up`,
        frames: scene.anims.generateFrameNumbers(key, { start: 1, end: 10 }),
        frameRate: 8,
        repeat: -1
      });

      // Idle
      scene.anims.create({ key: `${key}_idle-down`, frames: [{ key, frame: 22 }], frameRate: 1 });
      scene.anims.create({ key: `${key}_idle-left`, frames: [{ key, frame: 11 }], frameRate: 1 });
      scene.anims.create({ key: `${key}_idle-right`, frames: [{ key, frame: 33 }], frameRate: 1 });
      scene.anims.create({ key: `${key}_idle-up`, frames: [{ key, frame: 0 }], frameRate: 1 });
    }

    // Call for each NPC in BootScene or OfficeScene.create()
    ["npc_paul", "npc_ava", "npc_max", "npc_liam"].forEach(key => {
      createNpcAnimations(this, key);
    });
    this.npcs.forEach((npc) => {
      const s = this.physics.add.sprite(npc.x, npc.y, npc.spriteKey, 0);
      s.anims.play(`${npc.spriteKey}_idle-down`);
      console.log(npc.spriteKey);
      s.setImmovable(true);
      s.body.moves = false;


      // Label (name + role)
      const label = this.add
        .text(s.x, s.y - 40, `${npc.name} (${npc.role})`, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.4)",
          padding: { left: 4, right: 4, top: 2, bottom: 2 }
        })
        .setOrigin(0.5);

      const moodBarBg = this.add.rectangle(s.x, s.y - 28, 50, 6, 0x333333).setOrigin(0.5);
      const moodBarFill = this.add.rectangle(s.x - 25, s.y - 28, (npc.mood / 100) * 50, 6, 0x00ff00).setOrigin(0, 0.5);

      const zone = this.add.zone(s.x, s.y, 140, 120).setOrigin(0.5);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);

      this.npcSprites.push({ sprite: s, label, moodBarBg, moodBarFill, npc });
      this.interactZones.push({ zone, npc });
    });

    // ----- Prompt (bottom center) & Week counter (top-right) -----
    this.prompt = this.add
      .text(this.scale.width / 2, this.scale.height - 64, "Press E to talk", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#cfe0ff",
        backgroundColor: "rgba(20,28,56,0.6)",
        padding: { left: 10, right: 10, top: 6, bottom: 6 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3000)
      .setAlpha(0);

    this.weekText = this.add
      .text(
        this.scale.width - 16,
        10,
        `Week ${this.registry.get("week") || 1}/${
          this.registry.get("weeksTotal") || 12
        }`,
        {
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          color: "#ffffff",
          backgroundColor: "rgba(20,28,56,0.75)",
          padding: { left: 10, right: 10, top: 6, bottom: 6 }
        }
      )
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(2200);

    this.registry.events.on("changedata-week", () => this.updateWeekText());

    
    // ----- HUD (left) -----
    this.buildHud();
    this.buildServerRoom();
    this.buildCeoRoom();
    this.time.delayedCall(250, () => this.showInvestmentPanel());

    // ----- Controls -----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // ----- Camera -----
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // ----- Dialog / choices state -----
    this.dialogActive = false;
    this.dialogIndex = 0;
    this.activeNpc = null;
    this.activeDialog = [];
    this.dialogBox = null;
    this.choiceMenu = new ChoiceMenu(this); // we will set .dialogBox later when showing choices
    this.currentChoices = null;

    // ----- Resize & immediate end check -----
    this.scale.on("resize", this.onResize, this);
    this.checkImmediateEnd();
  }

  // Build all NPC definitions (dialog + choices)
  buildNpcList(cx, cy, playerName) {
    return [
      {
        name: "Rick",
        role: "Advisor Partner",
        x: cx + 180,
        y: cy + 20,
        spriteKey: "npc_paul",
        mood: 80,
          questions: [
            {
              dialog: [`Rick Advisor: So, ${playerName}, what's your unfair advantage—besides caffeine?`],
              choices: [
                { label: "Lean into AI hype 🚀", effects: { Hype: +15, Product: -5, Morale: -5, Funds: 0 }, result: "You ride the hype wave. Twitter buzzes; engineers grumble." },
                { label: "Polish the product 🛠️", effects: { Product: +12, Hype: -5, Morale: +2, Funds: -4000 }, result: "Fewer tweets, better product. Burn ticks up." }
              ]
            },
            {
              dialog: [`Rick Advisor: Market is crowded. Differentiate by brand or by tech?`],
              choices: [
                { label: "Brand storytelling 🎨", effects: { Hype: +10, Product: 0, Morale: +3, Funds: -1000 }, result: "People remember you; engineers roll their eyes." },
                { label: "Deep tech moat 🔬", effects: { Product: +15, Hype: -3, Morale: +1, Funds: -5000 }, result: "Core tech improves; buzz slows down." }
              ]
            },
            {
              dialog: [`Rick Advisor: Growth is slow. Push ads or double down on referrals?`],
              choices: [
                { label: "Aggressive ad spend 📢", effects: { Funds: -5000, Hype: +12, Product: 0, Morale: -2 }, result: "More eyeballs, but burn accelerates." },
                { label: "Referral incentives 🎁", effects: { Hype: +6, Morale: +2, Funds: -1000 }, result: "Users invite friends; growth feels organic." }
              ]
            },
            {
              dialog: [`Rick Advisor: Your burn rate is high. Cut perks or slow hiring?`],
              choices: [
                { label: "Cut team perks 💸", effects: { Funds: +3000, Morale: -8 }, result: "Money saved, but grumbling in Slack grows louder." },
                { label: "Slow down hiring ⏳", effects: { Funds: +2000, Product: -4, Morale: 0 }, result: "Costs drop, but delivery speed suffers." }
              ]
            },
            {
              dialog: [`Rick Advisor: A big corp offers a partnership. Take it or stay independent?`],
              choices: [
                { label: "Take the deal 🤝", effects: { Funds: +10000, Hype: +8, Morale: -3 }, result: "Cash injection comes with strings attached." },
                { label: "Stay independent 🏴", effects: { Product: +5, Hype: -2, Morale: +4 }, result: "Freedom maintained, but resources remain tight." }
              ]
            },
            {
              dialog: [`Rick Advisor: Customers want a mobile app now. Build fast or wait for funding?`],
              choices: [
                { label: "Build fast ⚡", effects: { Product: +10, Morale: -3, Funds: -4000 }, result: "You deliver early but quality takes a hit." },
                { label: "Wait for funding 💰", effects: { Funds: +0, Hype: -4, Morale: +1 }, result: "You buy time, but users get impatient." }
              ]
            },
            {
              dialog: [`Rick Advisor: The press wants an interview. Send you or your co-founder?`],
              choices: [
                { label: "Go yourself 🎤", effects: { Hype: +8, Morale: +2 }, result: "You nail the pitch; brand recognition grows." },
                { label: "Send co-founder 👥", effects: { Morale: +4, Hype: +4 }, result: "They shine in the spotlight; team bonds tighten." }
              ]
            },
            {
              dialog: [`Rick Advisor: Competitor is open-sourcing their core tech. Do the same?`],
              choices: [
                { label: "Open-source ours 👐", effects: { Hype: +10, Product: +3, Funds: -5000 }, result: "Developers rally; business model shifts." },
                { label: "Keep it closed 🔒", effects: { Product: +6, Morale: +2 }, result: "Control maintained, but some devs scoff." }
              ]
            },
            {
              dialog: [`Rick Advisor: Team is debating office vs. remote. What's the call?`],
              choices: [
                { label: "Office culture 🏢", effects: { Morale: -2, Product: +4, Funds: -8000 }, result: "Collaboration improves, costs rise." },
                { label: "Remote-first 🌍", effects: { Morale: +6, Funds: +2000, Product: -2 }, result: "Team enjoys flexibility; sync challenges remain." }
              ]
            },
            {
              dialog: [`Rick Advisor: Users love a side feature more than your core product. Pivot?`],
              choices: [
                { label: "Full pivot 🔄", effects: { Product: +8, Hype: +5, Funds: -7000 }, result: "You embrace change; roadmap resets." },
                { label: "Stay the course 🛤️", effects: { Product: +4, Morale: +2 }, result: "Focus preserved, but growth is slower." }
              ]
            },
            {
              dialog: [`Rick Advisor: You're invited to a pitch competition. Prepare heavily or wing it?`],
              choices: [
                { label: "Prepare heavily 📚", effects: { Product: -2, Hype: +8, Morale: +2 }, result: "Your polish impresses the judges." },
                { label: "Wing it 😎", effects: { Morale: +4, Hype: +4, Product: -4 }, result: "Charisma carries you… mostly." }
              ]
            },
            {
              dialog: [`Rick Advisor: Investor wants rapid expansion. Agree or resist?`],
              choices: [
                { label: "Agree and expand 🌍", effects: { Hype: +12, Product: -6, Funds: +8000 }, result: "New markets open, but strain increases." },
                { label: "Resist and focus 🎯", effects: { Product: +8, Morale: +3, Hype: -4 }, result: "Steady progress builds a stronger base." }
              ]
            }
          ]
      },

      {
        name: "Ava",
        role: "Co-Founder",
        x: cx - 300,
        y: cy - 100,
        spriteKey: "npc_ava",
        mood: 80,
        questions: [
          {
            dialog: [`Ava: MVP is almost ready. Ship now or rest this weekend?`],
            choices: [
              { label: "Ship scrappy MVP 📦", effects: { Product: +8, Hype: +6, Morale: -6, Funds: -6000 }, result: "You ship. Users trickle in; team yawns loudly." },
              { label: "Team weekend off 🌴", effects: { Morale: +14, Product: -4, Hype: -3, Funds: 0 }, result: "Rest helps; roadmap slips a hair." }
            ]
          },
          {
            dialog: [`Ava: Should we hire a junior dev now or wait until after funding?`],
            choices: [
              { label: "Hire now 🧑‍💻", effects: { Product: +6, Morale: +4, Funds: -5000 }, result: "Team gains energy; burn rate jumps." },
              { label: "Wait until funding ⏳", effects: { Funds: 0, Morale: -2 }, result: "Lean team keeps moving, but work piles up." }
            ]
          },
          {
            dialog: [`Ava: We're out of design bandwidth. Contract out or delay the feature?`],
            choices: [
              { label: "Hire contractor 🎨", effects: { Product: +5, Funds: -4500 }, result: "Design looks great, budget feels lighter." },
              { label: "Delay feature 🐢", effects: { Product: -2, Morale: -1 }, result: "Team keeps focus, but users wait longer." }
            ]
          },
          {
            dialog: [`Ava: The beta testers found bugs. Fix immediately or keep building?`],
            choices: [
              { label: "Fix now 🐞", effects: { Product: +6, Morale: +2 }, result: "Bugs squashed; momentum slows." },
              { label: "Keep building 🚧", effects: { Product: +3, Morale: -2 }, result: "Features progress, but bugs linger." }
            ]
          },
          {
            dialog: [`Ava: Do we launch in one country first or go global right away?`],
            choices: [
              { label: "One country first 🇺🇸", effects: { Product: +4, Hype: -2, Morale: +1 }, result: "Controlled launch keeps chaos down." },
              { label: "Global launch 🌍", effects: { Hype: +10, Product: -4, Funds: -5000 }, result: "Massive attention, massive workload." }
            ]
          },
          {
            dialog: [`Ava: Should we switch to a cheaper cloud provider?`],
            choices: [
              { label: "Yes, cut costs 💾", effects: { Funds: +8000, Product: -3 }, result: "Money saved; migration slows progress." },
              { label: "Stay put for now 🛑", effects: { Product: +2, Funds: 0 }, result: "No disruptions, but costs remain high." }
            ]
          },
          {
            dialog: [`Ava: A conference wants us to speak. Should we attend?`],
            choices: [
              { label: "Go present 🎤", effects: { Hype: +8, Funds: -7500 }, result: "Exposure grows; budget takes a hit." },
              { label: "Skip and focus 🏗️", effects: { Product: +4, Morale: +1 }, result: "Team stays on track, no new leads." }
            ]
          },
          {
            dialog: [`Ava: The prototype backend is slow. Optimize now or after more features?`],
            choices: [
              { label: "Optimize now ⚙️", effects: { Product: +8, Morale: +1, Funds: -4000 }, result: "Speed improves; roadmap slows slightly." },
              { label: "Features first 🚀", effects: { Product: +5, Morale: -1 }, result: "More capabilities, but lag remains." }
            ]
          },
          {
            dialog: [`Ava: Customers want 24/7 support. Hire a team or use chatbots?`],
            choices: [
              { label: "Hire support team 📞", effects: { Morale: +5, Product: +2, Funds: -5000 }, result: "Better service; burn rate jumps." },
              { label: "Deploy chatbots 🤖", effects: { Product: +3, Funds: -4000 }, result: "Cheap and quick; customers miss human touch." }
            ]
          },
          {
            dialog: [`Ava: Should we run a pre-order campaign?`],
            choices: [
              { label: "Yes, launch pre-orders 🛒", effects: { Funds: +7000, Hype: +5 }, result: "Cash flow improves; pressure builds." },
              { label: "No, wait until ready ⏳", effects: { Product: +3 }, result: "Development stays calm, no early money." }
            ]
          },
          {
            dialog: [`Ava: A new intern applicant seems eager but inexperienced. Hire?`],
            choices: [
              { label: "Hire and mentor 👩‍🎓", effects: { Morale: +6, Product: +2, Funds: -4000 }, result: "Fresh energy joins; training takes time." },
              { label: "Pass politely 🙅‍♀️", effects: { Product: +1 }, result: "Less distraction, no fresh ideas." }
            ]
          },
          {
            dialog: [`Ava: Should we start a company blog now or focus purely on product?`],
            choices: [
              { label: "Start blog ✍️", effects: { Hype: +6, Product: -2, Funds: -3500 }, result: "Content builds audience slowly." },
              { label: "Focus on product 💻", effects: { Product: +4 }, result: "Fewer distractions, but slower brand growth." }
            ]
          }
        ]
      },
      {
        name: "Max",
        role: "CTO",
        x: cx + 50,
        y: cy - 200,
        spriteKey: "npc_max",
        mood: 80,
        questions: [
          {
            dialog: [`Max: Hardcode and move fast, or do it right with tests?`],
            choices: [
              { label: "Move fast ⚡", effects: { Product: +6, Hype: +4, Morale: -7, Funds: 0 }, result: "Velocity spikes; tech debt too." },
              { label: "Do it right ✅", effects: { Product: +12, Morale: +3, Funds: -3000, Hype: 0 }, result: "Quality rises; burn rises. Future-you smiles." }
            ]
          },
          {
            dialog: [`Max: Should we refactor the legacy module now or wait until after launch?`],
            choices: [
              { label: "Refactor now 🛠️", effects: { Product: +8, Morale: +2, Funds: -2000 }, result: "Codebase is cleaner; deadlines slip slightly." },
              { label: "Wait until after launch 🏃", effects: { Product: +2, Morale: 0 }, result: "Features keep coming, but tech debt grows." }
            ]
          },
          {
            dialog: [`Max: Do we adopt a new database tech or stick with the current one?`],
            choices: [
              { label: "Adopt new DB 🗄️", effects: { Product: +5, Morale: +2, Funds: -3000 }, result: "More scalable; migration pains follow." },
              { label: "Stick with current DB 📂", effects: { Product: +3, Morale: 0 }, result: "Safe choice, but limits loom." }
            ]
          },
          {
            dialog: [`Max: Our tests are slow. Cut coverage or optimize?`],
            choices: [
              { label: "Cut coverage ✂️", effects: { Product: +3, Morale: -2 }, result: "Pipeline is faster, but bugs sneak in." },
              { label: "Optimize tests ⚙️", effects: { Product: +6, Morale: +1, Funds: -1000 }, result: "Stable and faster; extra work required." }
            ]
          },
          {
            dialog: [`Max: Should we invest in better dev tools?`],
            choices: [
              { label: "Yes, upgrade tools 🛠️", effects: { Morale: +6, Product: +4, Funds: -4000 }, result: "Developers smile; CFO frowns." },
              { label: "No, keep current setup 📦", effects: { Funds: 0 }, result: "Costs stay low; devs grumble occasionally." }
            ]
          },
          {
            dialog: [`Max: An open-source library we depend on is now unmaintained. Fork it or replace it?`],
            choices: [
              { label: "Fork it 🪓", effects: { Product: +5, Morale: +2, Funds: -1000 }, result: "Control gained; maintenance burden increases." },
              { label: "Replace it 🔄", effects: { Product: +3, Funds: -2000 }, result: "Safer in the long run; migration takes time." }
            ]
          },
          {
            dialog: [`Max: Should we integrate continuous deployment right now?`],
            choices: [
              { label: "Yes, automate deploy 🚀", effects: { Product: +7, Morale: +2, Funds: -2500 }, result: "Deploys are smooth; initial setup was tricky." },
              { label: "Not yet 🛑", effects: { Product: +1 }, result: "Stable for now; manual deploys slow releases." }
            ]
          },
          {
            dialog: [`Max: Do we allow remote pair programming for onboarding new hires?`],
            choices: [
              { label: "Yes, pair remotely 🖥️", effects: { Morale: +5, Product: +2, Funds: -1000 }, result: "New hires learn quickly; small cost to productivity." },
              { label: "No, stick to docs 📄", effects: { Product: +1, Morale: -2 }, result: "Efficiency maintained, but onboarding feels colder." }
            ]
          },
          {
            dialog: [`Max: Our API is messy. Rebuild or patch for now?`],
            choices: [
              { label: "Rebuild API 🔧", effects: { Product: +8, Morale: +2, Funds: -3000 }, result: "Cleaner design; launch date slips." },
              { label: "Patch for now 🩹", effects: { Product: +2 }, result: "Quick fix; long-term pain." }
            ]
          },
          {
            dialog: [`Max: Should we add real-time analytics for customers?`],
            choices: [
              { label: "Yes, build it 📊", effects: { Product: +6, Hype: +4, Funds: -4000 }, result: "Customers love it; devs pull late nights." },
              { label: "Not now 💤", effects: { Product: +1 }, result: "Focus remains; customers keep asking." }
            ]
          },
          {
            dialog: [`Max: We have tech debt in payment processing. Fix it before scaling?`],
            choices: [
              { label: "Fix now 💳", effects: { Product: +7, Morale: +2, Funds: -2000 }, result: "Stable payments; feature work slows." },
              { label: "Scale first 📈", effects: { Product: +3, Morale: -1 }, result: "Growth continues; risk increases." }
            ]
          },
          {
            dialog: [`Max: Should we introduce a code style guide company-wide?`],
            choices: [
              { label: "Yes, standardize 📏", effects: { Morale: +3, Product: +4 }, result: "Code is cleaner; some resist at first." },
              { label: "No, keep flexibility 🌀", effects: { Morale: +2 }, result: "Devs work freely; style is inconsistent." }
            ]
          }
        ]
      }
,
      {
        name: "Liam",
        role: "Intern",
        x: cx - 150,
        y: cy + 200,
        spriteKey: "npc_liam",
        mood: 80,
        questions: [
          {
            dialog: [`Liam: Landing page launch or pair-program refactor?`],
            choices: [
              { label: "Launch page 🌐", effects: { Hype: +10, Product: +2, Morale: +3, Funds: 0 }, result: "A few signups; intern feels heroic." },
              { label: "Pair & mentor 🤝", effects: { Product: +7, Morale: +8, Funds: -500, Hype: 0 }, result: "Codebase healthier; Liam levels up." }
            ]
          },
          {
            dialog: [`Liam: Should I work on bug fixes or try adding a fun Easter egg?`],
            choices: [
              { label: "Bug fixes 🐞", effects: { Product: +5, Morale: +1 }, result: "Bugs vanish; customers smile." },
              { label: "Easter egg 🎁", effects: { Morale: +5, Hype: +2 }, result: "Social media buzzes with the discovery." }
            ]
          },
          {
            dialog: [`Liam: Do you want me to focus on speed or clean code?`],
            choices: [
              { label: "Speed 🚀", effects: { Product: +4, Morale: -1 }, result: "Features appear quickly, but quality dips." },
              { label: "Clean code ✨", effects: { Product: +6, Morale: +2 }, result: "Future devs thank you; delivery slows." }
            ]
          },
          {
            dialog: [`Liam: Should I help with QA testing or keep coding my feature?`],
            choices: [
              { label: "Help QA 🧪", effects: { Product: +3, Morale: +2 }, result: "Bugs caught early; release safer." },
              { label: "Keep coding 💻", effects: { Product: +5, Morale: 0 }, result: "Feature finishes sooner; QA backlog grows." }
            ]
          },
          {
            dialog: [`Liam: Do you want me to write documentation or skip it for now?`],
            choices: [
              { label: "Write docs 📚", effects: { Product: +4, Morale: +2 }, result: "Future onboarding will be easier." },
              { label: "Skip docs ⏩", effects: { Product: +1 }, result: "Moves faster now, future confusion likely." }
            ]
          },
          {
            dialog: [`Liam: Should I join the design review or stay focused on dev work?`],
            choices: [
              { label: "Join review 🎨", effects: { Morale: +3, Product: +1 }, result: "Liam contributes ideas; dev time reduced." },
              { label: "Stay coding ⌨️", effects: { Product: +3 }, result: "Steady dev progress; design gets less input." }
            ]
          },
          {
            dialog: [`Liam: Should we spend time learning the new JS framework?`],
            choices: [
              { label: "Yes, learn it 📖", effects: { Product: +4, Morale: +4, Funds: -500 }, result: "Team learns modern skills." },
              { label: "Stick to current stack 🏗️", effects: { Product: +3 }, result: "No disruptions, but tech feels dated." }
            ]
          },
          {
            dialog: [`Liam: Do you want me to prepare a quick performance report?`],
            choices: [
              { label: "Yes, prepare 📊", effects: { Product: +2, Morale: +1 }, result: "Data helps guide next steps." },
              { label: "Not now 🛑", effects: { Product: 0 }, result: "Focus stays on dev; less visibility on progress." }
            ]
          },
          {
            dialog: [`Liam: Should I help customer support today?`],
            choices: [
              { label: "Yes, help support 📞", effects: { Morale: +4, Product: +1 }, result: "Customers appreciate the extra care." },
              { label: "Stay in dev 🖥️", effects: { Product: +3 }, result: "Code moves forward; support team stays busy." }
            ]
          },
          {
            dialog: [`Liam: Do you want me to automate some repetitive tasks?`],
            choices: [
              { label: "Automate 🛠️", effects: { Product: +5, Morale: +2 }, result: "Processes speed up long-term." },
              { label: "Leave as is 🔄", effects: { Product: 0 }, result: "No immediate changes; bottlenecks remain." }
            ]
          },
          {
            dialog: [`Liam: Should I experiment with accessibility improvements?`],
            choices: [
              { label: "Yes, improve ♿", effects: { Product: +4, Morale: +3 }, result: "More inclusive product; small delay in features." },
              { label: "Later ⏳", effects: { Product: 0 }, result: "Accessibility waits for another sprint." }
            ]
          },
          {
            dialog: [`Liam: Should I try building a mobile app version?`],
            choices: [
              { label: "Yes, start mobile 📱", effects: { Product: +6, Hype: +4, Funds: -2000 }, result: "Mobile prototype excites the team." },
              { label: "Focus on web 🌐", effects: { Product: +3 }, result: "Web stays strong; mobile waits." }
            ]
          }
        ]
      }

    ];
  }

  // ----- HUD (left) -----
  buildHud() {
    this.hudPanel = this.add.graphics().setScrollFactor(0).setDepth(2000);
    this.drawHudPanel();

    const title = this.registry.get("gameTitle") || "Startup Sprint";
    this.hudTitle = this.add
      .text(16, 10, `${title}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        color: "#ffffff"
      })
      .setScrollFactor(0)
      .setDepth(2001);

    this.hudStats = this.add
      .text(16, 46, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#e8f0ff",
        lineSpacing: 6
      })
      .setScrollFactor(0)
      .setDepth(2001);

    this.refreshHud();
  }


buildCeoRoom() {
  // Room size & position
  const w = this.room.width;
  const h = this.room.height;

  const ceoWidth = Math.floor(w * 0.25);  // ~25% width
  const ceoHeight = Math.floor(h * 0.35); // ~35% height
  const roomX = 0;                         // Left side
  const roomY = h - ceoHeight;              // Bottom side

  const wallThickness = 8;
  const doorHeight = 72;
  const doorCenterY = roomY + Math.floor(ceoHeight / 2);

  // Colliders group for walls
  this.ceoSolids = this.physics.add.staticGroup();

  // Helper for walls
  const makeWall = (cx, cy, ww, hh) => {
    const wall = this.physics.add.staticImage(cx, cy, "blackWall")
      .setDisplaySize(ww, hh)
      .setVisible(true);
    wall.refreshBody();
    this.ceoSolids.add(wall);
    return wall;
  };

  // Floor
  this.ceoFloor = this.add
    .tileSprite(roomX, roomY, ceoWidth, ceoHeight, "floor64")
    .setOrigin(0, 0)
    .setDepth(-1);

  // Walls: Top, Left, Bottom
  makeWall(roomX + ceoWidth / 2, roomY + wallThickness / 2, ceoWidth, wallThickness); // Top
  makeWall(roomX + wallThickness / 2, roomY + ceoHeight / 2, wallThickness, ceoHeight); // Left
  makeWall(roomX + ceoWidth / 2, roomY + ceoHeight - wallThickness / 2, ceoWidth, wallThickness); // Bottom

  // Right wall split for door gap
  const rightX = roomX + ceoWidth - wallThickness / 2;
  const gapTopEnd = doorCenterY - doorHeight / 2;
  const gapBottomStart = doorCenterY + doorHeight / 2;

  // Top segment of right wall
  const topSegH = gapTopEnd - roomY;
  if (topSegH > 0) {
    makeWall(rightX, roomY + topSegH / 2, wallThickness, topSegH);
  }

  // Bottom segment of right wall
  const bottomSegH = (roomY + ceoHeight) - gapBottomStart;
  if (bottomSegH > 0) {
    makeWall(rightX, gapBottomStart + bottomSegH / 2, wallThickness, bottomSegH);
  }

  // Desk in center of room
  const deskCX = roomX + ceoWidth / 2;
  const deskCY = roomY + ceoHeight / 2;

  const desk = this.physics.add.staticImage(deskCX, deskCY, "desk")
    .setOrigin(0.5, 0.5)
    .setDepth(10);
  desk.body.setSize(desk.width * 0.8, desk.height * 0.6)
    .setOffset((desk.width - desk.width * 0.8) / 2, (desk.height - desk.height * 0.6) / 2);

  // Chair in front of desk (facing toward door gap)
  const chair = this.physics.add.staticImage(deskCX + 64, deskCY, "chair")
    .setOrigin(0.5, 0.5)
    .setDepth(9);
  chair.body.setSize(chair.width * 0.7, chair.height * 0.7)
    .setOffset((chair.width - chair.width * 0.7) / 2, (chair.height - chair.height * 0.7) / 2);

  // Add desk/chair to solids
  this.ceoSolids.add(desk);
  this.ceoSolids.add(chair);

  // Collisions
  this.physics.add.collider(this.player, this.ceoSolids);

  // Label
  this.add.text(roomX + 14, roomY + 14, "CEO Office", {
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
    color: "#ffd27f",
    backgroundColor: "rgba(34,24,0,0.4)",
    padding: { left: 6, right: 6, top: 2, bottom: 2 }
  }).setDepth(10);
}


  buildServerRoom() {
    // Smaller server room at top-right
    const w = this.room.width;
    const h = this.room.height;

    const serverWidth  = Math.floor(w * 0.25);   // ~25% width
    const serverHeight = Math.floor(h * 0.35);   // ~35% height
    const roomX = w - serverWidth;
    const roomY = 0;

    const wallThickness = 8;
    const doorHeight = 72;
    const doorCenterY = roomY + Math.floor(serverHeight * 0.6);

    // Helper to make wall segments
    const makeWall = (cx, cy, ww, hh) => {
      const wall = this.physics.add.staticImage(cx, cy, "blackWall")
        .setDisplaySize(ww, hh)
        .setVisible(true);
      wall.refreshBody();
      this.serverSolids.add(wall);
      return wall;
    };

    // Floor
    this.serverFloor = this.add
      .tileSprite(roomX, roomY, serverWidth, serverHeight, "server_floor64")
      .setOrigin(0, 0)
      .setDepth(-1);

    // Colliders group
    this.serverSolids = this.physics.add.staticGroup();

    // Top / Right / Bottom walls
    makeWall(roomX + serverWidth / 2, roomY + wallThickness / 2, serverWidth, wallThickness);
    makeWall(roomX + serverWidth - wallThickness / 2, roomY + serverHeight / 2, wallThickness, serverHeight);
    makeWall(roomX + serverWidth / 2, roomY + serverHeight - wallThickness / 2, serverWidth, wallThickness);

    // Left wall split into two segments (gap instead of a door)
    const leftX = roomX + wallThickness / 2;
    const gapTopEnd    = doorCenterY - doorHeight / 2;
    const gapBottomStart = doorCenterY + doorHeight / 2;

    const topSegH = gapTopEnd - roomY;
    if (topSegH > 0) {
      makeWall(leftX, roomY + topSegH / 2, wallThickness, topSegH);
    }

    const bottomSegH = (roomY + serverHeight) - gapBottomStart;
    if (bottomSegH > 0) {
      makeWall(leftX, gapBottomStart + bottomSegH / 2, wallThickness, bottomSegH);
    }

    // Server racks inside (4 total: 2 columns x 2 rows)
    this.serverFixtures = this.physics.add.staticGroup();
    const cols = 2, rows = 2;
    const padX = 50;
    const padY = 30;
    const startX = roomX + 50;
    const startY = roomY + 50;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rack = this.physics.add.staticImage(
          startX + c * (56 + padX),
          startY + r * (96 + padY),
          "server_rack"
        ).setOrigin(0.5, 0.5);
        rack.refreshBody();
        this.serverFixtures.add(rack);
      }
    }

    // Collisions
    this.physics.add.collider(this.player, this.serverSolids);
    this.physics.add.collider(this.player, this.serverFixtures);

    // Label
    this.add.text(roomX + 14, roomY + 14, "Server Room", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#a8c8ff",
      backgroundColor: "rgba(10,16,34,0.4)",
      padding: { left: 6, right: 6, top: 2, bottom: 2 }
    }).setDepth(10);

    // Optional prompt zone near opening
    this.serverDoorZone = this.add.zone(roomX - 20, doorCenterY, 60, 80).setOrigin(1, 0.5);
    this.physics.world.enable(this.serverDoorZone, Phaser.Physics.Arcade.STATIC_BODY);
  }

  showInvestmentPanel() {
    if (this.investmentActive) return;

    const funds = this.registry.get("Funds") || 0;
    const maxBudget = Math.max(2000, Math.floor(funds * 0.25 / 1000) * 1000);
    if (funds <= 0) return;

    this.investmentActive = true;
    this.dialogActive = true;
    this.player.setVelocity(0, 0);

    this.alloc = { Mkt: 0, Tech: 0, Hire: 0 };
    this.maxBudget = Math.min(maxBudget, funds);

    const panelW = 600;
    const panelH = 400;
    const px = (this.scale.width - panelW) / 2;
    const py = (this.scale.height - panelH) / 2;

    // Background
    this.invG = this.add.graphics().setScrollFactor(0).setDepth(4000);
    this.invG.fillStyle(0x0b132a, 0.92).fillRoundedRect(px, py, panelW, panelH, 16);
    this.invG.lineStyle(2, 0x2c3966, 1).strokeRoundedRect(px, py, panelW, panelH, 16);

    this.invTitle = this.add.text(
      px + panelW / 2, py + 16,
      `Week ${this.registry.get("week")}: Allocate Investments`,
      { fontFamily: "system-ui", fontSize: "20px", color: "#ffffff" }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(4001);

    const categories = [
      { key: "Mkt", label: "Marketing", icon: "📢" },
      { key: "Tech", label: "Tech", icon: "💻" },
      { key: "Hire", label: "Hiring", icon: "🧑‍💼" }
    ];

    const startX = px + 100;
    const startY = py + 80;
    const colSpacing = 160;

    this.invButtons = [];

    categories.forEach((cat, i) => {
      const cx = startX + i * colSpacing;

      // Icon
      this.add.text(cx, startY, cat.icon, {
        fontFamily: "sans-serif", fontSize: "48px", color: "#ffffff"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(4001);

      // Label
      this.add.text(cx, startY + 50, cat.label, {
        fontFamily: "system-ui", fontSize: "16px", color: "#a8c8ff"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(4001);

      // Current allocation text
      const allocText = this.add.text(cx, startY + 80, "$0", {
        fontFamily: "system-ui", fontSize: "16px", color: "#ffffff"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(4001);

      // Invest button
      const investBtn = this.add.text(cx, startY + 110, "+ Invest $1k", {
        fontFamily: "system-ui", fontSize: "14px", color: "#00ff00",
        backgroundColor: "#003300", padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(4001).setInteractive();
      investBtn.on("pointerdown", () => {
        const sum = this.alloc.Mkt + this.alloc.Tech + this.alloc.Hire;
        if (sum + 1000 <= this.maxBudget) {
          this.alloc[cat.key] += 1000;
          allocText.setText(`$${this.formatNum(this.alloc[cat.key])}`);
          this.updateInvestmentPreview();
        }
      });

      // Remove button
      const removeBtn = this.add.text(cx, startY + 140, "- Remove $1k", {
        fontFamily: "system-ui", fontSize: "14px", color: "#ff5555",
        backgroundColor: "#330000", padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(4001).setInteractive();
      removeBtn.on("pointerdown", () => {
        if (this.alloc[cat.key] >= 1000) {
          this.alloc[cat.key] -= 1000;
          allocText.setText(`$${this.formatNum(this.alloc[cat.key])}`);
          this.updateInvestmentPreview();
        }
      });

      this.invButtons.push({ allocText });
    });

    // Preview effects
    this.invPreview = this.add.text(
      px + panelW / 2, py + panelH - 80, "",
      { fontFamily: "system-ui", fontSize: "16px", color: "#a8ffc8" }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(4001);

    // Confirm button
    const confirmBtn = this.add.text(px + panelW / 2 - 80, py + panelH - 40, "Confirm", {
      fontFamily: "system-ui", fontSize: "16px", color: "#ffffff",
      backgroundColor: "#004400", padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4001).setInteractive();
    confirmBtn.on("pointerdown", () => this.confirmInvestment());

    // Skip button
    const skipBtn = this.add.text(px + panelW / 2 + 80, py + panelH - 40, "Skip", {
      fontFamily: "system-ui", fontSize: "16px", color: "#ffffff",
      backgroundColor: "#440000", padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4001).setInteractive();
    skipBtn.on("pointerdown", () => {
      this.closeInvestmentPanel(false);

    });

    this.updateInvestmentPreview();
  }

  updateInvestmentPreview() {
    const eff = {
      Hype: Math.round((this.alloc.Mkt / 1000) * 2),
      Product: Math.round((this.alloc.Tech / 1000) * 1.5 + (this.alloc.Hire / 1000) * 0.5),
      Morale: Math.round((this.alloc.Hire / 1000) * 2 - Math.floor(this.alloc.Mkt / 4000))
    };
    const parts = [];
    if (eff.Product) parts.push(`${eff.Product > 0 ? "+" : ""}${eff.Product} Product`);
    if (eff.Morale) parts.push(`${eff.Morale > 0 ? "+" : ""}${eff.Morale} Morale`);
    if (eff.Hype) parts.push(`${eff.Hype > 0 ? "+" : ""}${eff.Hype} Hype`);
    this.invPreview.setText(`Projected: ${parts.length ? parts.join(", ") : "No change"}`);
  }


  adjustAlloc(key, delta) {
    const sum = this.alloc.Mkt + this.alloc.Tech + this.alloc.Hire;
    if (delta > 0 && sum + delta > this.maxBudget) return;
    this.alloc[key] = Math.max(0, this.alloc[key] + delta);
  }

  updateInvestmentPanel() {
    const sum = this.alloc.Mkt + this.alloc.Tech + this.alloc.Hire;
    const remain = this.maxBudget - sum;

    // Preview effects (per $1k):
    // Mkt: +2 Hype, -1 Morale per $4k
    // Tech: +1.5 Product
    // Hire: +2 Morale, +0.5 Product
    const eff = {
      Hype: Math.round((this.alloc.Mkt / 1000) * 2),
      Product: Math.round((this.alloc.Tech / 1000) * 1.5 + (this.alloc.Hire / 1000) * 0.5),
      Morale: Math.round((this.alloc.Hire / 1000) * 2 - Math.floor(this.alloc.Mkt / 4000))
    };

    this.invBudget.setText(`Budget: $${this.formatNum(this.maxBudget)}  •  Remaining: $${this.formatNum(remain)}`);
    this.invLines.setText([
      `1/Q  Marketing: $${this.formatNum(this.alloc.Mkt)}`,
      `2/W  Tech:      $${this.formatNum(this.alloc.Tech)}`,
      `3/E  Hiring:    $${this.formatNum(this.alloc.Hire)}`,
      `Total Invest:  $${this.formatNum(sum)}`
    ]);

    const parts = [];
    if (eff.Product) parts.push(`${eff.Product > 0 ? "+" : ""}${eff.Product} Product`);
    if (eff.Morale) parts.push(`${eff.Morale > 0 ? "+" : ""}${eff.Morale} Morale`);
    if (eff.Hype) parts.push(`${eff.Hype > 0 ? "+" : ""}${eff.Hype} Hype`);
    this.invPreview.setText(`Projected: ${parts.length ? parts.join(", ") : "No change"}`);
  }

  confirmInvestment() {
    
    const prevStats = {
      Funds: this.registry.get("Funds"),
      Product: this.registry.get("Product"),
      Morale: this.registry.get("Morale"),
      Hype: this.registry.get("Hype")
    };
    const sum = this.alloc.Mkt + this.alloc.Tech + this.alloc.Hire;
    if (sum <= 0) return this.closeInvestmentPanel(false);

    // Deduct funds
    this.registry.set("Funds", Math.max(0, (this.registry.get("Funds") || 0) - sum));

    // Apply effects (clamped by existing helpers)
    const eff = {
      Product: Math.round((this.alloc.Tech / 1000) * 1.5 + (this.alloc.Hire / 1000) * 0.5),
      Morale:  Math.round((this.alloc.Hire / 1000) * 2 - Math.floor(this.alloc.Mkt / 4000)),
      Hype:    Math.round((this.alloc.Mkt / 1000) * 2)
    };
    this.applyEffects(eff);
    this.refreshHud(prevStats);

    // Save last allocation for QoL
    this.registry.set("lastAlloc", { ...this.alloc });

    // Small confirmation popup in the dialog box style
    const summary = `Invested $${this.formatNum(sum)} — Effects: ${this.effectsToString(eff)}`;
    this.prompt.setAlpha(1).setText(summary);
    this.time.delayedCall(1200, () => this.prompt.setAlpha(0));

    this.closeInvestmentPanel(true);
  }

  closeInvestmentPanel(confirmed) {
    // Destroy graphics/text/buttons
    if (this.invG) this.invG.destroy();
    if (this.invTitle) this.invTitle.destroy();
    if (this.invPreview) this.invPreview.destroy();
    if (this.invButtons) {
      this.invButtons.forEach(btn => {
        if (btn.allocText) btn.allocText.destroy();
      });
    }
    // Destroy any stray category labels/icons
    this.children.list
      .filter(obj => obj.depth === 4001)
      .forEach(obj => obj.destroy());

    // Reset flags
    this.investmentActive = false;
    this.dialogActive = false;

    
      if (this.registry.get("week") === 6) {
        this.showBugNotification();
      }
      else{
        let liam = this.npcs.find(n => n.name === "Liam");
        console.log(liam);
        console.log(liam.mood);
        if (liam && liam.mood < 30) {
        this.showCleanupNotification();
        }
      }
  }

  showBugNotification() {
    this.dialogActive = true;

    const panelW = 500;
    const panelH = 200;
    const px = (this.scale.width - panelW) / 2;
    const py = (this.scale.height - panelH) / 2;

    // Background
    const notifG = this.add.graphics().setScrollFactor(0).setDepth(5000);
    notifG.fillStyle(0x1a1a1a, 0.95).fillRoundedRect(px, py, panelW, panelH, 12);
    notifG.lineStyle(2, 0xffffff, 1).strokeRoundedRect(px, py, panelW, panelH, 12);

    // Title
    const title = this.add.text(
      px + panelW / 2, py + 15, "⚠️ Server Room Threat!",
      { fontFamily: "system-ui", fontSize: "20px", color: "#ff6666" }
    ).setOrigin(0.5).setDepth(5001).setScrollFactor(0);

    // Message
    const msg = this.add.text(
      px + 20, py + 50,
      "Bugs are trying to enter your server room!\n" +
      "Click them before they get inside.\n" +
      "Each bug that enters will cost you $10,000!",
      { fontFamily: "system-ui", fontSize: "16px", color: "#ffffff", wordWrap: { width: panelW - 40 } }
    ).setDepth(5001).setScrollFactor(0);

    // OK button
    const okBtn = this.add.text(
      px + panelW / 2, py + panelH - 40, "OK - Let's Go!",
      { fontFamily: "system-ui", fontSize: "18px", color: "#00ff00",
        backgroundColor: "#003300", padding: { left: 12, right: 12, top: 6, bottom: 6 } }
    ).setOrigin(0.5).setInteractive().setDepth(5001).setScrollFactor(0);

    okBtn.on("pointerdown", () => {
      notifG.destroy();
      title.destroy();
      msg.destroy();
      okBtn.destroy();
      this.dialogActive = false;
      this.startBugMiniGame();
    });
  }






  drawHudPanel() {
    const w = Math.min(360, Math.max(260, this.scale.width * 0.26));
    const h = 140;
    this.hudPanel.clear();
    this.hudPanel
      .fillStyle(0x0b132a, 0.75)
      .fillRoundedRect(8, 8, w, h, 12)
      .lineStyle(2, 0x2c3966, 1)
      .strokeRoundedRect(8, 8, w, h, 12);
  }

refreshHud(prevStats) {
  const F = this.registry.get("Funds");
  const P = this.registry.get("Product");
  const M = this.registry.get("Morale");
  const H = this.registry.get("Hype");

  // If we got a previous stats object, calculate deltas
  const deltas = {};
  if (prevStats) {
    deltas.Funds   = F - prevStats.Funds;
    deltas.Product = P - prevStats.Product;
    deltas.Morale  = M - prevStats.Morale;
    deltas.Hype    = H - prevStats.Hype;
  }
  console.log(deltas)

  // Build the HUD lines with optional +/-
  const lines = [
    `💰 Funds: $${this.formatNum(F)}${this.formatDelta(deltas.Funds)}`,
    `💻 Product: ${P}%${this.formatDelta(deltas.Product)}`,
    `😅 Morale: ${M}%${this.formatDelta(deltas.Morale)}`,
    `📈 Hype: ${H}%${this.formatDelta(deltas.Hype)}`
  ];

  this.hudStats.setText(lines);

  // Remove the deltas after 5 seconds
  if (prevStats) {
    this.time.delayedCall(3000, () => {
      this.hudStats.setText([
        `💰 Funds: $${this.formatNum(F)}`,
        `💻 Product: ${P}%`,
        `😅 Morale: ${M}%`,
        `📈 Hype: ${H}%`
      ]);
    });
  }
}

// Helper to format +/-
formatDelta(val) {
  if (val === undefined || val === 0) return "";
  return val > 0 ? `  (+${this.formatNum(val)})` : `  (${this.formatNum(val)})`;
}


  formatNum(n) {
    try {
      return n.toLocaleString();
    } catch {
      return String(n);
    }
  }

  // ----- Dialog & choices flow -----
  tryStartDialog(npc) {
    if (this.dialogActive) return;
    if (this.npcTalkedThisWeek[npc.name]) return;

    const progress = this.npcQuestionProgress?.[npc.name] || 0;
    if (progress >= npc.questions.length) return; // no more questions

    // --- Make NPC face player ---
    const npcSpriteObj = this.npcSprites.find(o => o.npc === npc);
    if (npcSpriteObj) {
      const dx = this.player.x - npcSpriteObj.sprite.x;
      const dy = this.player.y - npcSpriteObj.sprite.y;

      const npcKey = npc.spriteKey;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) npcSpriteObj.sprite.anims.play(`${npcKey}_idle-right`);
      else npcSpriteObj.sprite.anims.play(`${npcKey}_idle-left`);
      } else {
        if (dy > 0) npcSpriteObj.sprite.anims.play(`${npcKey}_idle-down`);
      else npcSpriteObj.sprite.anims.play(`${npcKey}_idle-up`);
      }
    }

    // --- Make player face NPC ---
    if (npcSpriteObj) {
      const dx = npcSpriteObj.sprite.x - this.player.x;
      const dy = npcSpriteObj.sprite.y - this.player.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) this.player.anims.play("idle-right");
        else this.player.anims.play("idle-left");
      } else {
        if (dy > 0) this.player.anims.play("idle-down");
        else this.player.anims.play("idle-up");
      }
    }

    // --- Dialog setup ---
    this.dialogActive = true;
    this.dialogIndex = 0;
    this.activeNpc = npc;

    this.currentQuestion = npc.questions[progress];
    this.activeDialog = this.currentQuestion.dialog;

    this.dialogBox?.destroy();
    this.dialogBox = new DialogBox(this, { height: 180 });

    this.player.setVelocity(0, 0);
    this.player.body.moves = false;

    this.dialogBox.setTextTypewriter(this.activeDialog[this.dialogIndex]);
  }



  showChoices(choices) {
    this.currentChoices = choices;
    this.choiceMenu.destroy();
    // Give the menu our current dialog box for layout bounds
    this.choiceMenu.dialogBox = this.dialogBox;
    this.choiceMenu.show(choices, (idx) => this.choose(choices[idx]));
  }

  choose(choice) {
      this.applyEffects(choice.effects);
      this.activeNpc.mood = Phaser.Math.Clamp(
      this.activeNpc.mood + Phaser.Math.Between(-40, 10), // random change
      0, 100
    );
    this.refreshHud();

    // Increment question progress
    this.npcQuestionProgress[this.activeNpc.name] =
      (this.npcQuestionProgress[this.activeNpc.name] || 0) + 1;
    this.registry.set("npcQuestionProgress", this.npcQuestionProgress);

    // Mark NPC as talked to this week
    this.npcTalkedThisWeek[this.activeNpc.name] = true;
    this.registry.set("npcTalkedThisWeek", this.npcTalkedThisWeek);

    const effText = this.effectsToString(choice.effects);
    const summary = `${this.activeNpc.name}: ${choice.result || "Noted."}\n\nEffects: ${effText}`;
    this.choiceMenu.destroy();
    
    this.activeDialog = [summary];
    this.dialogIndex = 0;
    this.dialogBox.setTextTypewriter(this.activeDialog[this.dialogIndex]);

    // Flag that we just showed the result
    this.showingResult = true;
  }


  closeDialog() {
    if (!this.dialogActive) return;
    this.dialogActive = false;
    this.dialogBox?.destroy();
    this.dialogBox = null;
    this.choiceMenu?.destroy();
    this.currentChoices = null;
    this.player.body.moves = true;
    this.prompt.setAlpha(0);
    if (this.activeNpc) {
      const npcSpriteObj = this.npcSprites.find(o => o.npc === this.activeNpc);
      if (npcSpriteObj) {
       npcSpriteObj.sprite.anims.play(`${this.activeNpc.spriteKey}_idle-down`);
      }
     this.activeNpc = null;
   }
  }

  effectsToString(eff) {
    const parts = [];
    const sign = (v) => (v > 0 ? "+" : "");
    if (eff.Funds) parts.push(`${sign(eff.Funds)}$${this.formatNum(eff.Funds)}`);
    if (eff.Product) parts.push(`${sign(eff.Product)}${eff.Product} Product`);
    if (eff.Morale) parts.push(`${sign(eff.Morale)}${eff.Morale} Morale`);
    if (eff.Hype) parts.push(`${sign(eff.Hype)}${eff.Hype} Hype`);
    return parts.join(", ");
  }

  applyEffects(eff) {
    const clamp = (v) => Phaser.Math.Clamp(v, 0, 100);
    if (typeof eff.Funds === "number") {
      this.registry.set(
        "Funds",
        Math.max(0, (this.registry.get("Funds") || 0) + eff.Funds)
      );
    }
    if (typeof eff.Product === "number") {
      this.registry.set(
        "Product",
        clamp((this.registry.get("Product") || 0) + eff.Product)
      );
    }
    if (typeof eff.Morale === "number") {
      this.registry.set(
        "Morale",
        clamp((this.registry.get("Morale") || 0) + eff.Morale)
      );
    }
    if (typeof eff.Hype === "number") {
      this.registry.set(
        "Hype",
        clamp((this.registry.get("Hype") || 0) + eff.Hype)
      );
    }
  }

  advanceDialog() {
    if (!this.dialogActive) return;
    const current = this.activeDialog[this.dialogIndex];

    if (this.dialogBox.typing) {
      this.dialogBox.completeTypingNow(current);
      return;
    }

    this.dialogIndex++;
    if (this.dialogIndex >= this.activeDialog.length) {
      if (this.showingResult) {
        this.showingResult = false;
        this.closeDialog();
        if (this.checkImmediateEnd()) return;
        const talkedCount = Object.keys(this.npcTalkedThisWeek).length;
        if (talkedCount >= this.weeklyNpcLimit) {
          this.autoAdvanceWeek();
        }
      } else {
        this.showChoices(this.currentQuestion.choices);
      }
      return;
    }

    this.dialogBox.setTextTypewriter(this.activeDialog[this.dialogIndex]);
  }



  // One-tap UX for E/SPACE during dialog
  advanceOrComplete() {
    if (!this.dialogActive) return;

    // If choices are visible, "pulse" them so player knows to press 1/2 or click
    if (this.choiceMenu?.cards?.length) {
      this.choiceMenu.pulse?.();
      return;
    }

    const current = this.activeDialog?.[this.dialogIndex] ?? "";
    if (this.dialogBox?.typing) {
      // Finish the line and then auto-advance
      this.dialogBox.completeTypingNow(current);
      this.time.delayedCall(10, () => this.advanceDialog());
      return;
    }

    // Normal advance
    this.advanceDialog();
  }

  // ----- Auto next week & ending checks -----
autoAdvanceWeek() {
  const total = this.registry.get("weeksTotal") || 12;
  let week = this.registry.get("week") || 1;
  week += 1;

  this.cameras.main.fadeOut(350, 0, 0, 0, (_, progress) => {
    if (progress === 1) {
      if (week > total) {
        this.gotoEnd("final");
        return;
      }

      this.registry.set("week", week);
      this.npcTalkedThisWeek = {};
      this.registry.set("npcTalkedThisWeek", {});
      this.updateWeekText();

      this.npcs.forEach(npc => {
        npc.mood = Phaser.Math.Clamp(npc.mood + 10, 0, 100);
      });

      // Founder visit week?
      if (week % 3 === 0 && week <= 12) {
        let founderIndex = (week / 3) - 1;
        if (this.founders && this.founders[founderIndex]) {
          this.cameras.main.fadeIn(350, 0, 0, 0);
          this.time.delayedCall(350, () => {
            this.startFounderConversation(
              this.founders[founderIndex],
              week,
              () => {
                if (week === 12) {
                  this.gotoEnd("final"); // Week 12 ends game
                } else {
                  this.showInvestmentPanel(); // After talking, show panel
                }
              }
            );
          });
          return; // Prevent immediate investment panel
        }
      }

      // Normal non-founder week flow
      this.cameras.main.fadeIn(350, 0, 0, 0);
      this.time.delayedCall(350, () => this.showInvestmentPanel());
    }
  });
}


  checkImmediateEnd() {
    if ((this.registry.get("Funds") || 0) <= 0) {
      this.gotoEnd("bankrupt");
      return true;
    }
    return false;
  }

  gotoEnd(kind) {
    const snapshot = {
      week: this.registry.get("week") || 1,
      weeksTotal: this.registry.get("weeksTotal") || 12,
      Funds: this.registry.get("Funds") || 0,
      Product: this.registry.get("Product") || 0,
      Morale: this.registry.get("Morale") || 0,
      Hype: this.registry.get("Hype") || 0
    };
    this.scene.start("EndScene", { ending: kind, snapshot });
  }

  // ----- Resize -----
  onResize(gameSize) {
    const { width, height } = gameSize;
    this.room.width = width;
    this.room.height = height;

    this.cameras.main.setBounds(0, 0, width, height);
    this.physics.world.setBounds(0, 0, width, height);

    this.floor.setSize(width, height);
    this.floor.setDisplaySize(width, height);

    this.drawHudPanel();
    this.prompt.setPosition(width / 2, height - 64);
    this.weekText.setPosition(width - 16, 10);

    // Relayout dialog & reposition choices if open
    if (this.dialogBox) this.dialogBox.relayout();
    if (this.currentChoices && this.choiceMenu?.cards?.length) {
      // Re-show to recompute positions against the resized dialog box
      this.choiceMenu.dialogBox = this.dialogBox;
      this.choiceMenu.show(this.currentChoices, (idx) =>
        this.choose(this.currentChoices[idx])
      );
    }
  }

  loseFundsForBug(bug) {
    if (!bug.active) return;
    bug.destroy();
    
    const prevStats = {
      Funds: this.registry.get("Funds"),
      Product: this.registry.get("Product"),
      Morale: this.registry.get("Morale"),
      Hype: this.registry.get("Hype")
    };
    this.registry.set("Funds", Math.max(0, this.registry.get("Funds") - 10000));
    this.refreshHud(prevStats);
    console.log("one bug entered")
    this.bugsDefeated++;
    if (this.bugsDefeated >= this.bugCount) {
      this.endBugMiniGame();
    }
  }

  endBugMiniGame() {
    this.bugActive = false;
    this.dialogActive = false;
    this.bugs.clear(true, true);
    if (this.bugTimer) this.bugTimer.remove(false);

    this.prompt.setAlpha(1).setText("Bug invasion over!");
    this.time.delayedCall(1500, () => this.prompt.setAlpha(0));
  }

  spawnBug() {
    const roomX = this.room.width - Math.floor(this.room.width * 0.25);
    const doorY = Math.floor(this.room.height * 0.35) * 0.6;

    const spawnX = roomX - 200; 
    const spawnY = doorY + Phaser.Math.Between(-50, 50);

    const bug = this.bugs.create(spawnX, spawnY, "bug")
      .setOrigin(0.5)
      .setScale(1.5)
      .setDepth(10)
      .setInteractive(); // <-- Make it clickable

    // On click, squash it
    bug.on("pointerdown", () => {
      bug.destroy();
      this.bugsDefeated++;
      if (this.bugsDefeated >= this.bugCount) {
        this.endBugMiniGame();
      }
    });

    // Move toward door
    this.physics.moveTo(bug, roomX - 10, doorY, 60);

    // Check if bug reached inside
    bug.update = () => {
      const dist = Phaser.Math.Distance.Between(bug.x, bug.y, roomX, doorY);
      if (dist < 15) {
        this.loseFundsForBug(bug);
      }
    };
  }


  startBugMiniGame() {
    this.bugCount = 5;
    this.bugsDefeated = 0;
    this.bugs = this.physics.add.group();
    this.bugActive = true;
    this.dialogActive = true; // freeze normal interactions

    // Spawn bugs every 1s
    this.bugTimer = this.time.addEvent({
      delay: 1000,
      repeat: this.bugCount - 1,
      callback: () => this.spawnBug()
    });

  }


  showCleanupNotification() {
    const panelW = 500;
    const panelH = 200;
    const px = (this.scale.width - panelW) / 2;
    const py = (this.scale.height - panelH) / 2;

    const bg = this.add.graphics().setDepth(5000).setScrollFactor(0);
    bg.fillStyle(0x222222, 0.95).fillRoundedRect(px, py, panelW, panelH, 12);
    bg.lineStyle(2, 0xffffff).strokeRoundedRect(px, py, panelW, panelH, 12);

    const title = this.add.text(
      px + panelW / 2, py + 15,
      "🧹 Emergency Office Cleanup!",
      { fontFamily: "system-ui", fontSize: "20px", color: "#ffcc00" }
    ).setOrigin(0.5).setDepth(5001);

    const msg = this.add.text(
      px + 20, py + 60,
      "Liam’s freaking out — trash is everywhere!\n" +
      "Click ALL the trash before the timer runs out.\n" +
      "If you don’t… the codebase will be a bug nest 🐛💻\n" +
      "Win: + Morale, + Liam Mood | Lose: -Morale, -Liam Mood",
      { fontFamily: "system-ui", fontSize: "16px", color: "#ffffff", wordWrap: { width: panelW - 40 } }
    ).setDepth(5001);

    const okBtn = this.add.text(
      px + panelW / 2, py + panelH - 40,
      "OK - Let's Clean!",
      { fontFamily: "system-ui", fontSize: "18px", color: "#00ff00", backgroundColor: "#003300", padding: { left: 12, right: 12, top: 6, bottom: 6 } }
    ).setOrigin(0.5).setInteractive().setDepth(5001);

    okBtn.on("pointerdown", () => {
      bg.destroy();
      title.destroy();
      msg.destroy();
      okBtn.destroy();
      this.startCleanupMiniGame();
    });
  }


  startCleanupMiniGame() {
    this.cleanupActive = true;
    this.trashGroup = this.add.group();
    this.trashToClean = 6; // Number of trash items

    for (let i = 0; i < this.trashToClean; i++) {
      const x = Phaser.Math.Between(100, this.scale.width - 100);
      const y = Phaser.Math.Between(150, this.scale.height - 100);
      
      const trash = this.add.sprite(x, y, "trash_paper") // you can load a trash image or use a placeholder
        .setInteractive()
        .setScale(0.5)
        .setDepth(100);

      trash.on("pointerdown", () => {
        trash.destroy();
        this.trashToClean--;
        if (this.trashToClean <= 0) {
          this.endCleanupMiniGame(true);
        }
      });

      this.trashGroup.add(trash);
    }

    // Timer for cleanup (15 seconds)
    this.time.delayedCall(15000, () => {
      if (this.cleanupActive) {
        this.endCleanupMiniGame(false);
      }
    });
  }

  endCleanupMiniGame(success) {
    this.cleanupActive = false;
    this.trashGroup.clear(true, true);

    // Find Liam NPC
    let liam = this.npcs.find(n => n.name === "Liam");

    if (success) {
      this.registry.set("Morale", (this.registry.get("Morale") || 0) + 10);
      if (liam) {
        liam.mood = Phaser.Math.Clamp(liam.mood + 20, 0, 100);
      }
      this.showTempMessage("✅ Cleanup Complete! +Morale +Liam Mood");
    } else {
      this.registry.set("Morale", (this.registry.get("Morale") || 0) - 5);
      if (liam) {
        liam.mood = Phaser.Math.Clamp(liam.mood - 10, 0, 100);
      }
      this.showTempMessage("❌ Too Slow! -Morale -Liam Mood");
    }

    this.refreshHud();
  }


  // Temporary on-screen message
  showTempMessage(text) {
    const msg = this.add.text(this.scale.width / 2, 50, text, {
      fontFamily: "system-ui", fontSize: "20px", color: "#ffffff", backgroundColor: "#000000"
    }).setOrigin(0.5).setDepth(5002);

    this.time.delayedCall(2000, () => msg.destroy());
  }

  checkFounderVisit() {
    let week = this.registry.get("week");

    if (week % 3 === 0 && week <= 12) {
      let founderIndex = (week / 3) - 1;
      if (this.founders[founderIndex]) {
        this.startFounderConversation(this.founders[founderIndex], week);
      }
    }
  }


startFounderConversation(founder, week, onComplete) {
  const stats = {
    Funds: this.registry.get("Funds") || 0,
    Product: this.registry.get("Product") || 0,
    Morale: this.registry.get("Morale") || 0,
    Hype: this.registry.get("Hype") || 0
  };

  const tipObj = founder.tips.find(t => t.condition(stats));

  // Dark overlay
  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5)
    .setOrigin(0, 0)
    .setDepth(2000);

  // Dialog box
  const dialogBoxHeight = 150;
  const dialogBoxY = this.scale.height - dialogBoxHeight / 2;
  const dialogBox = this.add.rectangle(
    this.scale.width / 2,
    dialogBoxY,
    this.scale.width - 100,
    dialogBoxHeight,
    0xffffff
  ).setStrokeStyle(2, 0x000000)
   .setDepth(2001);

  // Portrait positioned so its bottom edge is just above the dialog box
  const portrait = this.add.image(
    120,
    dialogBoxY - dialogBoxHeight / 2 + 30, // 10px gap above box
    founder.imageKey
  ).setOrigin(0.5, 1) // bottom-center anchor
   .setDepth(2001)
   .setScale(0.5);

  // Dialog text
  const dialogText = this.add.text(
    dialogBox.x - dialogBox.width / 2 + 20,
    dialogBox.y - 60,
    `${founder.name}: ${tipObj.text}`,
    {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#000000",
      wordWrap: { width: dialogBox.width - 40 }
    }
  ).setDepth(2002);

  // Continue button
  const continueBtn = this.add.text(
    dialogBox.x + dialogBox.width / 2 - 80,
    dialogBox.y + 50,
    "Continue",
    {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#0000ff"
    }
  ).setDepth(2002).setInteractive();

  continueBtn.on("pointerdown", () => {
    overlay.destroy();
    portrait.destroy();
    dialogBox.destroy();
    dialogText.destroy();
    continueBtn.destroy();

    if (onComplete) onComplete();
  });
}



  // ----- Frame loop -----
  update() {
    // Which NPC is near?
    let near = null;
    if (this.investmentActive) {
      this.player.setVelocity(0,0);
      return; // block the rest of update()
    }

    if (this.bugActive) {
      this.bugs.children.each(b => {
        if (b.update) b.update();
      });
      return; // prevent normal gameplay during mini-game
    }

    for (let { zone, npc } of this.interactZones) {
      if (this.physics.overlap(this.player, zone)) {
        near = npc;
        break;
      }
    }

    // Prompt visibility
    if (
      !this.dialogActive &&
      near &&
      (Object.keys(this.npcTalkedThisWeek).length < this.weeklyNpcLimit)
    ) {
      if (this.prompt.alpha < 1) this.prompt.setAlpha(1);
      this.prompt.setText("Press E to talk");
    } else {
      if (this.prompt.alpha > 0) this.prompt.setAlpha(0);
    }

    // Movement
    if (!this.dialogActive) {
      const up = this.cursors.up.isDown || this.keys.W.isDown;
      const down = this.cursors.down.isDown || this.keys.S.isDown;
      const left = this.cursors.left.isDown || this.keys.A.isDown;
      const right = this.cursors.right.isDown || this.keys.D.isDown;
      const speed = 220;

      let moving = false;
      let lastAnim = "idle-down";

      this.player.setVelocity(0);

      if (left) {
        this.player.setVelocityX(-speed);
        this.player.anims.play("walk-left", true);
        lastAnim = "idle-left";
        moving = true;
      } else if (right) {
        this.player.setVelocityX(speed);
        this.player.anims.play("walk-right", true);
        lastAnim = "idle-right";
        moving = true;
      }

      if (up) {
        this.player.setVelocityY(-speed);
        if (!moving) this.player.anims.play("walk-up", true);
        lastAnim = "idle-up";
        moving = true;
      } else if (down) {
        this.player.setVelocityY(speed);
        if (!moving) this.player.anims.play("walk-down", true);
        lastAnim = "idle-down";
        moving = true;
      }

      if (!moving) {
        this.player.anims.play(lastAnim, true);
      }
    } else {
      this.player.setVelocity(0, 0);
    }

    // Labels
    this.npcSprites.forEach(({ sprite, label }) =>
      label.setPosition(sprite.x, sprite.y - 40)
    );
    this.nameText.setPosition(this.player.x, this.player.y - 40);

    // Inputs (E/SPACE for dialog; E now completes + advances in one tap)
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.E) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
    ) {
      if (near && !this.dialogActive) {
        this.tryStartDialog(near);
      } else if (this.dialogActive) {
        this.advanceOrComplete();
      }
    }

    this.npcSprites.forEach(({ sprite, label, moodBarBg, moodBarFill, npc }) => {
    label.setPosition(sprite.x, sprite.y - 40);
    moodBarBg.setPosition(sprite.x, sprite.y - 28);
    moodBarFill.setPosition(sprite.x - 25, sprite.y - 28);
    moodBarFill.width = (npc.mood / 100) * 50;

    // Change color based on mood
    if (npc.mood > 66) moodBarFill.setFillStyle(0x00ff00);
    else if (npc.mood > 33) moodBarFill.setFillStyle(0xffff00);
    else moodBarFill.setFillStyle(0xff0000);
  });

  }

  // ----- Misc -----
  updateWeekText() {
    this.weekText.setText(
      `Week ${this.registry.get("week") || 1}/${
        this.registry.get("weeksTotal") || 12
      }`
    );
  }
}
