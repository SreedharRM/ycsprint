export default class DialogBox {
  constructor(scene, opts = {}) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;

    this.width = Math.min(opts.width || w - 32, w - 32);
    this.height = opts.height || 160;
    this.margin = opts.margin || 16;

    const x = (w - this.width) / 2;
    const y = h - this.height - this.margin;

    // Panel
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(4000);
    this.panel.fillStyle(0x0b132a, 0.95).fillRoundedRect(x, y, this.width, this.height, 16);
    this.panel.lineStyle(2, 0x2c3966, 1).strokeRoundedRect(x, y, this.width, this.height, 16);

    // Soft drop shadow
    this.shadow = scene.add.graphics().setScrollFactor(0).setDepth(3999).setAlpha(0.25);
    this.shadow.fillStyle(0x000000, 1).fillRoundedRect(x + 4, y + 6, this.width, this.height, 16);

    // Text
    this.text = scene.add.text(x + 18, y + 16, "", {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: "16px",
      color: "#e6edff",
      wordWrap: { width: this.width - 36 }
    }).setScrollFactor(0).setDepth(4001);

    // Advance hint
    this.hint = scene.add.text(x + this.width - 18, y + this.height - 12, "▶", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#a9b8ff"
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(4001).setAlpha(0);

    this.layoutX = x; this.layoutY = y;
    this.isVisible = true;
    this.typeTimer = null;
    this.typing = false;

    // Tiny pop-in
    this.panel.setScale(0.98); this.shadow.setScale(0.98); this.text.setAlpha(0);
    scene.tweens.add({ targets: [this.panel, this.shadow], scale: 1, duration: 150, ease: "Back.Out" });
    scene.tweens.add({ targets: this.text, alpha: 1, duration: 150, delay: 120 });
  }

  getBounds() {
    return { x: this.layoutX, y: this.layoutY, width: this.width, height: this.height };
  }

  setVisible(v) { [this.shadow, this.panel, this.text, this.hint].forEach(o => o.setVisible(v)); }

  destroy() { this.stopTyping(); [this.shadow, this.panel, this.text, this.hint].forEach(o => o.destroy()); }

  stopTyping() { if (this.typeTimer) { this.typeTimer.remove(false); this.typeTimer = null; } this.typing = false; }

  async setTextTypewriter(full, speed = 18) {
    this.stopTyping();
    this.text.setText(""); this.hint.setAlpha(0); this.typing = true;
    let i = 0;
    await new Promise(resolve => {
      this.typeTimer = this.scene.time.addEvent({
        delay: speed, loop: true,
        callback: () => {
          if (i >= full.length) { this.stopTyping(); this.hint.setAlpha(0.8); resolve(); return; }
          this.text.setText(full.slice(0, ++i));
        }
      });
    });
  }

  completeTypingNow(full) { this.stopTyping(); this.text.setText(full); this.hint.setAlpha(0.8); }

  relayout() {
    const w = this.scene.scale.width, h = this.scene.scale.height;
    this.width = Math.min(this.width, w - 32);
    const x = (w - this.width) / 2;
    const y = h - this.height - this.margin;

    this.shadow.clear().fillStyle(0x000000, 1).fillRoundedRect(x + 4, y + 6, this.width, this.height, 16);
    this.panel.clear().fillStyle(0x0b132a, 0.95).fillRoundedRect(x, y, this.width, this.height, 16)
      .lineStyle(2, 0x2c3966, 1).strokeRoundedRect(x, y, this.width, this.height, 16);
    this.text.setPosition(x + 18, y + 16).setWordWrapWidth(this.width - 36);
    this.hint.setPosition(x + this.width - 18, y + this.height - 12);
    this.layoutX = x; this.layoutY = y;
  }
}
