export default class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create() {
    const { width, height } = this.scale;
    const title = this.registry.get("gameTitle");
    const subtitle = this.registry.get("gameSubtitle");

    this.add.text(width/2, height*0.18, title, { fontFamily:"system-ui,sans-serif", fontSize:"52px", fontStyle:"bold", color:"#fff" }).setOrigin(0.5);
    this.add.text(width/2, height*0.26, subtitle, { fontFamily:"system-ui,sans-serif", fontSize:"20px", color:"#cfe0ff" }).setOrigin(0.5);

    this.createButton(width/2, height*0.42, "Start New Game", () => {
      this.registry.set("week", 1);
      this.registry.set("npcTalkedThisWeek", {}); // reset weekly talks
      this.registry.set("Funds", 50000);
      this.registry.set("Product", 20);
      this.registry.set("Morale", 70);
      this.registry.set("Hype", 10);
      this.scene.start("OfficeScene");
    });

    this.createButton(width/2, height*0.52, "Settings", () => this.scene.start("SettingsScene"));
    this.createButton(width/2, height*0.62, "Credits", () => this.showCredits());
  }

  createButton(x,y,text,callback){
    const btn = this.add.text(x,y,text,{fontFamily:"system-ui,sans-serif",fontSize:"28px",backgroundColor:"#1b2340",padding:{left:20,right:20,top:10,bottom:10},color:"#cfe0ff"})
      .setOrigin(0.5).setInteractive({useHandCursor:true})
      .on("pointerover",()=>btn.setStyle({backgroundColor:"#2c3966"}))
      .on("pointerout",()=>btn.setStyle({backgroundColor:"#1b2340"}))
      .on("pointerdown",callback);
    return btn;
  }

  showCredits(){
    const {width,height}=this.scale;
    const bg=this.add.rectangle(width/2,height/2,width,height,0x000000,0.7).setDepth(10);
    const t=this.add.text(width/2,height/2,"Startup Sprint\n\nCreated by: You\nMade with Phaser 3",{fontFamily:"system-ui,sans-serif",fontSize:"22px",color:"#fff",align:"center"}).setOrigin(0.5).setDepth(10);
    bg.setInteractive().on("pointerdown",()=>{bg.destroy();t.destroy();});
  }
}
