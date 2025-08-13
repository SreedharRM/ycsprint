import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import SettingsScene from "./scenes/SettingsScene.js";
import OfficeScene from "./scenes/OfficeScene.js";
import EndScene from "./scenes/EndScene.js";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#0e1018",
  parent: "game",
  physics: { default: "arcade", arcade: { debug: false, gravity: { y: 0 } } },
  pixelArt: true,
  scene: [BootScene, MenuScene, SettingsScene, OfficeScene, EndScene],
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  dom: { createContainer: true }
};

const game = new Phaser.Game(config);
window.addEventListener("resize", () => game.scale.resize(window.innerWidth, window.innerHeight));
