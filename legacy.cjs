// force-semicolon: ignore-all

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
(async () => {
  globalThis.AttackModule = await import('./attack.mjs');
})();
const pvp = require('mineflayer-pvp').plugin
const toolPlugin = require('mineflayer-tool').plugin

const botStats = {
  settings: {
    instant_reply: false,

    reading_wpm: 201,
    typing_cpm: 369
  },
  status: { // DO NOT CHANGE UNLESS YOU KNOW WHAT YOURE DOING 
    WEAPON: ""
  }
}

const bot = mineflayer.createBot({
  host: 'localhost',        // Server
  //host: '10.242.11.0',    // Development
  port: 25565,
  username: 'TakoyakiYea'
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(pvp)
bot.loadPlugin(toolPlugin)

// General Functions
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

// Estimating Functions
function EstimateReadingTimeMs(str) {
	return((str.trim().split(/\s+/).length / botStats.settings.reading_wpm) * 60000) // returned in miliseconds
}
function EstimateTypingTimeMs(str) {
	return((str.length / botStats.settings.typing_cpm) * 60000)
}

function SelectBestWeapon() {
  const weapon_tier = ["netherite", "diamond", "iron", "copper", "stone", "golden", "wooden"]
  const weapon_list = ["sword", "axe", "pickaxe", "shovel", "hoe"] // Tools with damage, spear not included (for now)
  for (const tool of weapon_list) { for (const tier of weapon_tier) {
    const weapon = bot.inventory.items().find(item => item.name === `${tier}_${tool}`)
    if (weapon) {
      console.log(`Desired weapon found: ${weapon.name}`);
      return weapon;
    }
  }} return '' // Return nothing if no weapon found
}

function CustomAttack(target) {
  bot.chat(`Weak resisting (fighting) ${target.username ? target.username : target.entityType}, chat tk?stop to stop`)
  botStats.WEAPON = SelectBestWeapon()
  if (botStats.WEAPON) bot.equip(botStats.WEAPON, 'hand');
  AttackModule.attack(bot, target)
}

async function HandleChat(username, message) {
  if (botStats.settings.instant_reply) {
  await sleep(212); // Average human reaction time
  await sleep(EstimateReadingTimeMs(message)); // Reading
  await sleep(974); // Give Tako some time
  }

  let response = "";

  const msg = message
    .toLowerCase()
    .trim()
    .replace("~`!@#$%^&*()_+-={}[]|\\:;\"\'<>?,./", "")

  switch (msg) {
    case "hi":
    case "hello":
    case "hey":
      response = `Hello ${username}!`;
      break;

    case "whats up":
      response = `Nothing much!`;
      break;

    case "cat":
    case "meow": 
      response = `meow`;
      break;
    
    case "miku":
      response = `mikudayooo`;
      break;

    case "crazy":
      response = "Crazy? I was crazy once. They locked me in a room. A rubber room! A rubber room with rats,and rats make me crazy. Crazy? I was crazy once. They locked me in a room. A rubber room! A rubber room with rats,and rats make me crazy. Crazy? I was crazy once. They locked me in a room. A rubber room! A rubber room with rats,and rats make me crazy. Crazy? I was crazy once. They locked me in a room. A rubber room! A rubber room with rats,and rats make me crazy. Crazy? I was crazy once. They locked me in a room. A rubber room! A rubber room with rats,and rats make me crazy.";
      break;

    case "check me out":
      const playerEntity = bot.players[username]?.entity;
        if (playerEntity) {
            // Look at the player's eye level (offset Y by 1.6)
            bot.lookAt(playerEntity.position.offset(0, 1.6, 0));
        }
      break;

    case "btstats":
      response = `Hunger = ${bot.food+"+"+bot.foodSaturation}, WeakResisting = ${botStats.weak_resisting}`; break
    case "btinstantreply":
      botStats.settings.instant_reply = !botStats.settings.instant_reply
      response = `Instant Reply is now ${botStats.settings.instant_reply? "on":"off"}`; break
    case "btstop":
      bot.pvp.stop(); AttackModule.stop_attack(bot); break

    default:
      break;
  }

  // optional typing delay simulation
  if (botStats.settings.instant_reply) await sleep(EstimateTypingTimeMs(response));

  bot.chat(response);
}

bot.on('login', () => {
  console.log(`Bot has logged in to server`);
})

bot.on('entityHurt', (entity, source) => {
    if (source && entity.username === bot.username) {
    if (botStats.settings.weak_resist_enabled) {
      WeakResist(source)
    } else {
      bot.pathfinder.setGoal(null)
        botStats.WEAPON = SelectBestWeapon()
        if (botStats.WEAPON) bot.equip(botStats.WEAPON, 'hand')
      bot.pvp.attack(source)
      // bot.chat(`debug msg: attacking ${source.username ? source.username : source.entityType}, chat tk?stop to stop`)
    }
    

  }
});

bot.on('entityDead', (entity) => {
  if (bot.pvp.target === entity) {
    bot.pvp.stop()
    console.log(`Target ${entity.username || entity.name} has been neutralised. Combat exiting.`);
  }
})
bot.on('death', () => {
  bot.pvp.stop()
})

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  // if (message.toLowerCase().includes("tako")) 
  HandleChat(username, message);
});

bot.on('kicked', (reason, loggedIn) => { 
  console.log(`Bot was kicked due to: "${reason.type == "string" ? reason.value : "No reason provided"}" ${loggedIn ? "" : "while logging in"}`)
});
