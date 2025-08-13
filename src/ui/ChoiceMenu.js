export default class ChoiceMenu {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} opts { dialogBox }
   * @param {Array<{label:string}>} choices
   * @param {(index:number)=>void} onSelect
   */
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.dialogBox = opts.dialogBox;
    this.cards = [];
    this.keys = scene.input.keyboard.addKeys({
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO
    });
  }

  show(choices, onSelect) {
    this.destroy();
    const b = this.dialogBox.getBounds();
    const yBase = b.y + b.height - 64;
    const spacing = 24;
    const cardW = Math.min(360, Math.max(240, this.scene.scale.width * 0.35));
    const leftX = (this.scene.scale.width / 2) - cardW - spacing / 2;
    const rightX = (this.scene.scale.width / 2) + spacing / 2;

    const makeCard = (idx, x, y, label) => {
      const g = this.scene.add.graphics().setDepth(4002).setScrollFactor(0);
      g.fillStyle(0x1b2340, 1).fillRoundedRect(x, y, cardW, 50, 12);
      g.lineStyle(2, 0x2c3966, 1).strokeRoundedRect(x, y, cardW, 50, 12);
      const t = this.scene.add.text(x + 12, y + 12, `${idx + 1}. ${label}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#cfe0ff",
        wordWrap: { width: cardW - 24 }
      }).setDepth(4003).setScrollFactor(0);
      const container = { bg: g, text: t };
      [g, t].forEach(o => o.setAlpha(0).setY(o.y + 30));
      // Pop-in animation
      this.scene.tweens.add({ targets: [g, t], alpha: 1, y: "-=30", duration: 220, delay: idx * 90, ease: "Back.Out" });

      // Hover effects
      g.setInteractive(new Phaser.Geom.Rectangle(x, y, cardW, 50), Phaser.Geom.Rectangle.Contains)
        .on("pointerover", () => this.scene.tweens.add({ targets: [g], scale: 1.02, duration: 120 }))
        .on("pointerout", () => this.scene.tweens.add({ targets: [g], scale: 1.0, duration: 120 }))
        .on("pointerdown", () => onSelect(idx));
      t.setInteractive({ useHandCursor: true }).on("pointerdown", () => onSelect(idx));

      this.cards.push(container);
    };

    makeCard(0, leftX, yBase, choices[0].label);
    makeCard(1, rightX, yBase, choices[1].label);

    // Keyboard shortcuts
    this.oneHandler = () => onSelect(0);
    this.twoHandler = () => onSelect(1);
    this.keys.ONE.on("down", this.oneHandler);
    this.keys.TWO.on("down", this.twoHandler);
  }

  destroy() {
    if (this.cards.length) {
      this.cards.forEach(c => { c.bg.destroy(); c.text.destroy(); });
      this.cards.length = 0;
    }
    if (this.keys?.ONE && this.oneHandler) this.keys.ONE.off("down", this.oneHandler);
    if (this.keys?.TWO && this.twoHandler) this.keys.TWO.off("down", this.twoHandler);
  }

    pulse() {
    if (!this.cards?.length) return;
    this.cards.forEach(c => {
      this.scene.tweens.add({
        targets: [c.bg, c.text],
        scale: 1.04,
        duration: 90,
        yoyo: true
      });
    });
  }

}
