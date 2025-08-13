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

    this.platform = this.add.image(cx, cy + 40, "platform");
    this.solids.create(cx, cy, "desk");
    this.solids.create(cx - 120, cy + 60, "chair");

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

      const label = this.add
        .text(s.x, s.y - 40, `${npc.name} (${npc.role})`, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.4)",
          padding: { left: 4, right: 4, top: 2, bottom: 2 }
        })
        .setOrigin(0.5);

      const zone = this.add.zone(s.x, s.y, 140, 120).setOrigin(0.5);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);

      this.npcSprites.push({ sprite: s, label, npc });
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
        name: "Paul",
        role: "YC Advisor Partner",
        x: cx + 180,
        y: cy + 20,
        spriteKey: "npc_paul",
          questions: [
            {
              dialog: [`Paul Advisor: So, ${playerName}, what's your unfair advantage—besides caffeine?`],
              choices: [
                { label: "Lean into AI hype 🚀", effects: { Hype: +15, Product: -5, Morale: -5, Funds: 0 }, result: "You ride the hype wave. Twitter buzzes; engineers grumble." },
                { label: "Polish the product 🛠️", effects: { Product: +12, Hype: -5, Morale: +2, Funds: -2000 }, result: "Fewer tweets, better product. Burn ticks up." }
              ]
            },
            {
              dialog: [`Paul Advisor: Market is crowded. Differentiate by brand or by tech?`],
              choices: [
                { label: "Brand storytelling 🎨", effects: { Hype: +10, Product: 0, Morale: +3, Funds: -1000 }, result: "People remember you; engineers roll their eyes." },
                { label: "Deep tech moat 🔬", effects: { Product: +15, Hype: -3, Morale: +1, Funds: -3000 }, result: "Core tech improves; buzz slows down." }
              ]
            },
            {
              dialog: [`Paul Advisor: Growth is slow. Push ads or double down on referrals?`],
              choices: [
                { label: "Aggressive ad spend 📢", effects: { Funds: -5000, Hype: +12, Product: 0, Morale: -2 }, result: "More eyeballs, but burn accelerates." },
                { label: "Referral incentives 🎁", effects: { Hype: +6, Morale: +2, Funds: -1000 }, result: "Users invite friends; growth feels organic." }
              ]
            },
            {
              dialog: [`Paul Advisor: Your burn rate is high. Cut perks or slow hiring?`],
              choices: [
                { label: "Cut team perks 💸", effects: { Funds: +3000, Morale: -8 }, result: "Money saved, but grumbling in Slack grows louder." },
                { label: "Slow down hiring ⏳", effects: { Funds: +2000, Product: -4, Morale: 0 }, result: "Costs drop, but delivery speed suffers." }
              ]
            },
            {
              dialog: [`Paul Advisor: A big corp offers a partnership. Take it or stay independent?`],
              choices: [
                { label: "Take the deal 🤝", effects: { Funds: +10000, Hype: +8, Morale: -3 }, result: "Cash injection comes with strings attached." },
                { label: "Stay independent 🏴", effects: { Product: +5, Hype: -2, Morale: +4 }, result: "Freedom maintained, but resources remain tight." }
              ]
            },
            {
              dialog: [`Paul Advisor: Customers want a mobile app now. Build fast or wait for funding?`],
              choices: [
                { label: "Build fast ⚡", effects: { Product: +10, Morale: -3, Funds: -4000 }, result: "You deliver early but quality takes a hit." },
                { label: "Wait for funding 💰", effects: { Funds: +0, Hype: -4, Morale: +1 }, result: "You buy time, but users get impatient." }
              ]
            },
            {
              dialog: [`Paul Advisor: The press wants an interview. Send you or your co-founder?`],
              choices: [
                { label: "Go yourself 🎤", effects: { Hype: +8, Morale: +2 }, result: "You nail the pitch; brand recognition grows." },
                { label: "Send co-founder 👥", effects: { Morale: +4, Hype: +4 }, result: "They shine in the spotlight; team bonds tighten." }
              ]
            },
            {
              dialog: [`Paul Advisor: Competitor is open-sourcing their core tech. Do the same?`],
              choices: [
                { label: "Open-source ours 👐", effects: { Hype: +10, Product: +3, Funds: -2000 }, result: "Developers rally; business model shifts." },
                { label: "Keep it closed 🔒", effects: { Product: +6, Morale: +2 }, result: "Control maintained, but some devs scoff." }
              ]
            },
            {
              dialog: [`Paul Advisor: Team is debating office vs. remote. What's the call?`],
              choices: [
                { label: "Office culture 🏢", effects: { Morale: -2, Product: +4, Funds: -3000 }, result: "Collaboration improves, costs rise." },
                { label: "Remote-first 🌍", effects: { Morale: +6, Funds: +2000, Product: -2 }, result: "Team enjoys flexibility; sync challenges remain." }
              ]
            },
            {
              dialog: [`Paul Advisor: Users love a side feature more than your core product. Pivot?`],
              choices: [
                { label: "Full pivot 🔄", effects: { Product: +8, Hype: +5, Funds: -3000 }, result: "You embrace change; roadmap resets." },
                { label: "Stay the course 🛤️", effects: { Product: +4, Morale: +2 }, result: "Focus preserved, but growth is slower." }
              ]
            },
            {
              dialog: [`Paul Advisor: You're invited to a pitch competition. Prepare heavily or wing it?`],
              choices: [
                { label: "Prepare heavily 📚", effects: { Product: -2, Hype: +8, Morale: +2 }, result: "Your polish impresses the judges." },
                { label: "Wing it 😎", effects: { Morale: +4, Hype: +4, Product: -4 }, result: "Charisma carries you… mostly." }
              ]
            },
            {
              dialog: [`Paul Advisor: Investor wants rapid expansion. Agree or resist?`],
              choices: [
                { label: "Agree and expand 🌍", effects: { Hype: +12, Product: -6, Funds: +5000 }, result: "New markets open, but strain increases." },
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
        questions: [
          {
            dialog: [`Ava: MVP is almost ready. Ship now or rest this weekend?`],
            choices: [
              { label: "Ship scrappy MVP 📦", effects: { Product: +8, Hype: +6, Morale: -6, Funds: -1000 }, result: "You ship. Users trickle in; team yawns loudly." },
              { label: "Team weekend off 🌴", effects: { Morale: +14, Product: -4, Hype: -3, Funds: 0 }, result: "Rest helps; roadmap slips a hair." }
            ]
          },
          {
            dialog: [`Ava: Should we hire a junior dev now or wait until after funding?`],
            choices: [
              { label: "Hire now 🧑‍💻", effects: { Product: +6, Morale: +4, Funds: -3000 }, result: "Team gains energy; burn rate jumps." },
              { label: "Wait until funding ⏳", effects: { Funds: 0, Morale: -2 }, result: "Lean team keeps moving, but work piles up." }
            ]
          },
          {
            dialog: [`Ava: We're out of design bandwidth. Contract out or delay the feature?`],
            choices: [
              { label: "Hire contractor 🎨", effects: { Product: +5, Funds: -2500 }, result: "Design looks great, budget feels lighter." },
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
              { label: "Global launch 🌍", effects: { Hype: +10, Product: -4, Funds: -2000 }, result: "Massive attention, massive workload." }
            ]
          },
          {
            dialog: [`Ava: Should we switch to a cheaper cloud provider?`],
            choices: [
              { label: "Yes, cut costs 💾", effects: { Funds: +4000, Product: -3 }, result: "Money saved; migration slows progress." },
              { label: "Stay put for now 🛑", effects: { Product: +2, Funds: 0 }, result: "No disruptions, but costs remain high." }
            ]
          },
          {
            dialog: [`Ava: A conference wants us to speak. Should we attend?`],
            choices: [
              { label: "Go present 🎤", effects: { Hype: +8, Funds: -1500 }, result: "Exposure grows; budget takes a hit." },
              { label: "Skip and focus 🏗️", effects: { Product: +4, Morale: +1 }, result: "Team stays on track, no new leads." }
            ]
          },
          {
            dialog: [`Ava: The prototype backend is slow. Optimize now or after more features?`],
            choices: [
              { label: "Optimize now ⚙️", effects: { Product: +8, Morale: +1, Funds: -1000 }, result: "Speed improves; roadmap slows slightly." },
              { label: "Features first 🚀", effects: { Product: +5, Morale: -1 }, result: "More capabilities, but lag remains." }
            ]
          },
          {
            dialog: [`Ava: Customers want 24/7 support. Hire a team or use chatbots?`],
            choices: [
              { label: "Hire support team 📞", effects: { Morale: +5, Product: +2, Funds: -5000 }, result: "Better service; burn rate jumps." },
              { label: "Deploy chatbots 🤖", effects: { Product: +3, Funds: -1000 }, result: "Cheap and quick; customers miss human touch." }
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
              { label: "Hire and mentor 👩‍🎓", effects: { Morale: +6, Product: +2, Funds: -1000 }, result: "Fresh energy joins; training takes time." },
              { label: "Pass politely 🙅‍♀️", effects: { Product: +1 }, result: "Less distraction, no fresh ideas." }
            ]
          },
          {
            dialog: [`Ava: Should we start a company blog now or focus purely on product?`],
            choices: [
              { label: "Start blog ✍️", effects: { Hype: +6, Product: -2, Funds: -500 }, result: "Content builds audience slowly." },
              { label: "Focus on product 💻", effects: { Product: +4 }, result: "Fewer distractions, but slower brand growth." }
            ]
          }
        ]
      },
      {
        name: "Max",
        role: "CTO",
        x: cx + 350,
        y: cy - 200,
        spriteKey: "npc_max",
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

  drawHudPanel() {
    const w = Math.min(360, Math.max(260, this.scale.width * 0.26));
    const h = 120;
    this.hudPanel.clear();
    this.hudPanel
      .fillStyle(0x0b132a, 0.75)
      .fillRoundedRect(8, 8, w, h, 12)
      .lineStyle(2, 0x2c3966, 1)
      .strokeRoundedRect(8, 8, w, h, 12);
  }

  refreshHud() {
    const F = this.registry.get("Funds");
    const P = this.registry.get("Product");
    const M = this.registry.get("Morale");
    const H = this.registry.get("Hype");

    this.hudStats.setText([
      `💰 Funds: $${this.formatNum(F)}`,
      `💻 Product: ${P}%`,
      `😅 Morale: ${M}%`,
      `📈 Hype: ${H}%`
    ]);
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
        this.cameras.main.fadeIn(350, 0, 0, 0);
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

  // ----- Frame loop -----
  update() {
    // Which NPC is near?
    let near = null;
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
