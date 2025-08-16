export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  create() {
    const { width, height } = this.scale;

    // Title
    this.add.text(width / 2, height * 0.15, "⚙️ Settings", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "48px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5);

    // How to Play instructions
    this.add.text(
      width / 2,
      height * 0.25,
      "💡 How to Play:\nManage your funds, keep morale high,\nand finish the product within 12 weeks.",
      {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        color: "#cfe0ff",
        align: "center"
      }
    ).setOrigin(0.5);

    // Name edit button
    this.nameButton = this.createButton(
      width / 2,
      height * 0.4,
      `Edit Name: ${this.registry.get("playerName")}`,
      () => this.openNameDialog()
    );

    // Back to menu button
    this.createButton(
      width / 2,
      height * 0.6,
      "⬅ Back to Menu",
      () => this.scene.start("MenuScene")
    );
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontFamily: "system-ui, sans-serif",
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

  openNameDialog() {
    const { width, height } = this.scale;

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
      .setDepth(1000)
      .setInteractive();

    // Modal frame
    const modalW = Math.min(520, Math.floor(width * 0.9));
    const modalH = 200;
    const modalX = width / 2 - modalW / 2;
    const modalY = height / 2 - modalH / 2;

    const frame = this.add.graphics({ x: modalX, y: modalY }).setDepth(1001);
    frame.fillStyle(0x141c38, 1).fillRoundedRect(0, 0, modalW, modalH, 16);
    frame.lineStyle(2, 0x2c3966, 1).strokeRoundedRect(0, 0, modalW, modalH, 16);

    // Modal title
    const titleText = this.add.text(width / 2, modalY + 18, "Edit Player Name", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "22px",
      color: "#cfe0ff"
    }).setOrigin(0.5).setDepth(1002);

    // HTML content
    const html = `
      <div style="
        width:${modalW - 40}px;
        display:flex; flex-direction:column; gap:12px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color:#e6edff;
      ">
        <input id="nameInput" type="text" maxlength="16"
          value="${this.registry.get("playerName")}"
          style="
            padding:10px 12px; font-size:16px;
            border-radius:10px; outline:none; border:1px solid #2c3966;
            background:#0f162f; color:#ffffff; width:100%;
          " />
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="cancelBtn" style="
            padding:10px 14px; font-size:15px; border-radius:10px; border:1px solid #2c3966;
            background:#1b2340; color:#cfe0ff; cursor:pointer;
          ">Cancel</button>
          <button id="saveBtn" style="
            padding:10px 14px; font-size:15px; border-radius:10px; border:1px solid #3b7cff;
            background:#3b7cff; color:#ffffff; cursor:pointer;
          ">Save</button>
        </div>
        <div style="font-size:12px; opacity:.8;">Max length: 16 characters</div>
      </div>
    `;

    const dom = this.add.dom(width / 2, height / 2)
      .createFromHTML(html)
      .setDepth(1003)
      .setOrigin(0.5);

    dom.x = modalX + modalW / 2;
    dom.y = modalY + modalH / 2 + 8;

    const input = dom.getChildByID("nameInput");
    const saveBtn = dom.getChildByID("saveBtn");
    const cancelBtn = dom.getChildByID("cancelBtn");

    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);

    const closeModal = () => {
      overlay.destroy();
      frame.destroy();
      titleText.destroy();
      if (dom.node && dom.node.parentNode) {
        dom.node.parentNode.removeChild(dom.node);
      }
      dom.destroy();
    };

    const doSave = () => {
      const newName = String(input.value || "").trim();
      if (!newName) return;
      this.registry.set("playerName", newName);
      this.nameButton.setText(`Edit Name: ${newName}`);
      closeModal();
    };

    saveBtn.addEventListener("click", doSave);
    cancelBtn.addEventListener("click", closeModal);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSave();
      if (e.key === "Escape") closeModal();
    });

    overlay.on("pointerdown", (pointer) => {
      const insideX = pointer.x >= modalX && pointer.x <= modalX + modalW;
      const insideY = pointer.y >= modalY && pointer.y <= modalY + modalH;
      if (!insideX || !insideY) closeModal();
    });
  }
}
