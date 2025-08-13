export default class EndScene extends Phaser.Scene {
  constructor() { super("EndScene"); }

  init(data) {
    this.snapshot = data?.snapshot || {};
    this.ending = data?.ending || "final";
  }

  create() {
    const { width: w, height: h } = this.scale;
    const bg = this.add.rectangle(0, 0, w, h, 0x0b132a, 1).setOrigin(0, 0);

    // Decide outcome
    const { Funds = 0, Product = 0, Morale = 0, Hype = 0, week = 1, weeksTotal = 12 } = this.snapshot;
    let title = "You Survived YC 🎓";
    let subtitle = "Demo Day done. Onward!";
    let color = "#cfe0ff";

    if (Funds <= 0 || this.ending === "bankrupt") {
      title = "Game Over — Bankrupt 💸";
      subtitle = "The runway ran out. Happens to the best of us.";
      color = "#ffb0b0";
      this.cameraShake();
    } else if ((Funds >= 1_000_000) || (Product >= 85 && Hype >= 85 && Funds >= 200_000)) {
      title = "Billion-Dollar Trajectory 🦄";
      subtitle = "Investors are fighting to get in. Don’t forget us on your yacht.";
      color = "#b7ffb7";
      this.confetti();
    } else if (Product >= 60 && Hype >= 60) {
      title = "Funded & Growing 🚀";
      subtitle = "Strong demo. Term sheets incoming.";
      color = "#d6ffd6";
      this.confetti(0.5);
    }

    // Title
    this.add.text(w / 2, h * 0.28, title, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "48px",
      color
    }).setOrigin(0.5);

    // Subtitle & stats
    this.add.text(w / 2, h * 0.36, subtitle, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      color: "#e6edff"
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.48, [
      `Week: ${week}/${weeksTotal}`,
      `Funds: $${this.formatNum(Funds)}`,
      `Product: ${Product}%   Morale: ${Morale}%   Hype: ${Hype}%`
    ].join("\n"), {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      color: "#e6edff",
      align: "center",
      lineSpacing: 6
    }).setOrigin(0.5);

    // Buttons
    this.createButton(w / 2, h * 0.65, "Play Again", () => this.scene.start("MenuScene"));
    this.createButton(w / 2, h * 0.74, "Back to Menu", () => this.scene.start("MenuScene"));
  }

  createButton(x, y, text, onClick) {
    const btn = this.add.text(x, y, text, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "22px",
      backgroundColor: "#1b2340",
      color: "#cfe0ff",
      padding: { left: 18, right: 18, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => btn.setStyle({ backgroundColor: "#2c3966" }));
    btn.on("pointerout", () => btn.setStyle({ backgroundColor: "#1b2340" }));
    btn.on("pointerdown", onClick);
    return btn;
  }

  formatNum(n) { try { return n.toLocaleString(); } catch { return String(n); } }

  confetti(intensity = 1) {
    const { width: w, height: h } = this.scale;
    const pieces = Math.floor(120 * intensity);
    for (let i = 0; i < pieces; i++) {
      const r = this.add.rectangle(
        Phaser.Math.Between(0, w),
        -Phaser.Math.Between(0, h / 2),
        Phaser.Math.Between(6, 10),
        Phaser.Math.Between(8, 14),
        Phaser.Math.RND.pick([0xff5e7e, 0x5effa1, 0x6ea5ff, 0xffe066])
      ).setAlpha(0.9);
      this.tweens.add({
        targets: r, y: h + 30, angle: "+=360", duration: Phaser.Math.Between(1200, 2200),
        ease: "Sine.In", delay: Phaser.Math.Between(0, 400), onComplete: () => r.destroy()
      });
    }
  }

  cameraShake() { this.cameras.main.flash(300, 255, 64, 64); this.cameras.main.shake(400, 0.006); }
}
