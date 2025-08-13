// src/scenes/WeekOverlay.js
export default class WeekOverlay extends Phaser.Scene {
  constructor() {
    super({ key: "WeekOverlay", active: false });
  }

  init(data) {
    this.nextWeek = data?.nextWeek ?? ((this.registry.get("week") || 1) + 1);
    this.total    = data?.total    ?? (this.registry.get("weeksTotal") || 12);
    this.onDone   = data?.onDone   ?? null; // callback when overlay closes
  }

  create() {
    const { width: w, height: h } = this.scale;

    // Dark fade background
    const bg = this.add.rectangle(0, 0, w, h, 0x0b132a, 0.85)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(9990);

    // WEEK label
    const label = this.add.text(w / 2, h / 2 - 40, "WEEK", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "28px",
      color: "#cfe0ff",
      letterSpacing: 4
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    // Week number
    const num = this.add.text(w / 2, h / 2 + 20, `${this.nextWeek} / ${this.total}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "72px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setScale(0.9);

    // Animations
    this.tweens.add({ targets: label, alpha: 1, duration: 250, ease: "Sine.Out" });
    this.tweens.add({ targets: num, alpha: 1, scale: 1, duration: 450, delay: 100, ease: "Back.Out" });

    // After delay, fade out
// After delay, fade out
this.time.delayedCall(1300, () => {
  this.tweens.add({
    targets: [bg, label, num],
    alpha: 0,
    duration: 250,
    onComplete: () => {
      this.scene.stop(); // remove overlay
      // Bring OfficeScene back to top so it receives input again
      if (this.scene.isActive("OfficeScene")) {
        this.scene.bringToTop("OfficeScene");
      }
      if (typeof this.onDone === "function") this.onDone();
    }
  });
});

  }
}
