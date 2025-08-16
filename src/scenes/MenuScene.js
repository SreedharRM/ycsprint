export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    // Always clear everything first in case we're returning from another scene
    this.children.removeAll();

    const { width, height } = this.scale;
    const title = this.registry.get("gameTitle") || "Startup Sprint";
    const subtitle = this.registry.get("gameSubtitle") || "Build your dream startup!";

    // Title text
    this.add.text(width / 2, height * 0.18, title, {
      fontFamily: "system-ui,sans-serif",
      fontSize: "52px",
      fontStyle: "bold",
      color: "#fff"
    }).setOrigin(0.5);

    // Subtitle text
    this.add.text(width / 2, height * 0.26, subtitle, {
      fontFamily: "system-ui,sans-serif",
      fontSize: "20px",
      color: "#cfe0ff"
    }).setOrigin(0.5);

    // If we left the game in progress via ESC, show a Continue button
    if (this.registry.get("hasSave")) {
      this.createButton(width / 2, height * 0.38, "Continue", () => {
        // simply return to the OfficeScene (registry values are already preserved)
        this.scene.start("OfficeScene");
      });

      this.createButton(width / 2, height * 0.50, "Start New Game", () => {
        // reset progress and clear the save flag
        this.registry.set("hasSave", false);
        this.registry.set("week", 1);
        this.registry.set("npcTalkedThisWeek", {});
        this.registry.set("Funds", 50000);
        this.registry.set("Product", 20);
        this.registry.set("Morale", 70);
        this.registry.set("Hype", 10);
        this.scene.start("OfficeScene");
      });
    } else {
      // No save => only show Start New Game
      this.createButton(width / 2, height * 0.42, "Start New Game", () => {
        this.registry.set("week", 1);
        this.registry.set("npcTalkedThisWeek", {});
        this.registry.set("Funds", 50000);
        this.registry.set("Product", 20);
        this.registry.set("Morale", 70);
        this.registry.set("Hype", 10);
        this.scene.start("OfficeScene");
      });
    }

    // Settings
    this.createButton(width / 2, height * 0.62, "Settings", () => {
      this.scene.start("SettingsScene");
    });

    // Credits
    this.createButton(width / 2, height * 0.72, "Credits", () => this.showCredits());
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontFamily: "system-ui,sans-serif",
      fontSize: "28px",
      backgroundColor: "#1b2340",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      color: "#cfe0ff"
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => btn.setStyle({ backgroundColor: "#2c3966" }))
      .on("pointerout", () => btn.setStyle({ backgroundColor: "#1b2340" }))
      .on("pointerdown", callback);
    return btn;
  }

  showCredits() {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(10);

    const creditsText = `
Startup Sprint
Created by: You
Made with Phaser 3

Special Thanks to Founders:
- Garry Tan
- Michael Seibel
- Paul Graham
- Jared Friedman
    `.trim();

    const t = this.add.text(width / 2, height / 2, creditsText, {
      fontFamily: "system-ui,sans-serif",
      fontSize: "22px",
      color: "#fff",
      align: "center"
    }).setOrigin(0.5).setDepth(10);

    bg.setInteractive().on("pointerdown", () => {
      bg.destroy();
      t.destroy();
    });
  }
}
