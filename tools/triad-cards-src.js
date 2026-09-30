// Sorgente delle carte di Triple Triad: 200 giochi che conoscono tutti, 20 per livello (stile FF8: livello 1 = carte comuni,
// livello 10 = leggendarie). Da qui tools/build-triad-cards.js genera triad-cards.js (valori dei lati, elementi, rarità).
// Formato: [nome, anno, piattaforma, genere]. Generi: plat, rpg, act, fps, fight, horror, strat, race, puzzle, arcade, sport, mobile, online, indie, stealth, sandbox
// NON cambiare l'ordine o i nomi dopo la pubblicazione del server: l'id delle carte deriva dal nome.
module.exports = {
  10: [
    ['Super Mario Bros.', 1985, 'NES', 'plat'], ['The Legend of Zelda: Ocarina of Time', 1998, 'N64', 'act'], ['Tetris', 1984, 'Multi', 'puzzle'],
    ['Pokémon Rosso e Blu', 1996, 'Game Boy', 'rpg'], ['Final Fantasy VII', 1997, 'PS1', 'rpg'], ['Super Mario 64', 1996, 'N64', 'plat'],
    ['Street Fighter II', 1991, 'Arcade', 'fight'], ['Pac-Man', 1980, 'Arcade', 'arcade'], ['Doom', 1993, 'PC', 'fps'], ['Minecraft', 2011, 'PC', 'sandbox'],
    ['Grand Theft Auto V', 2013, 'PS3', 'act'], ['Half-Life 2', 2004, 'PC', 'fps'], ['The Legend of Zelda: Breath of the Wild', 2017, 'Switch', 'act'],
    ['Chrono Trigger', 1995, 'SNES', 'rpg'], ['Metal Gear Solid', 1998, 'PS1', 'stealth'], ['The Elder Scrolls V: Skyrim', 2011, 'PC', 'rpg'],
    ['The Witcher 3: Wild Hunt', 2015, 'PC', 'rpg'], ['Dark Souls', 2011, 'PS3', 'stealth'], ['Elden Ring', 2022, 'PC', 'rpg'], ['Red Dead Redemption 2', 2018, 'PS4', 'act']
  ],
  9: [
    ['The Legend of Zelda: A Link to the Past', 1991, 'SNES', 'act'], ['Super Mario World', 1990, 'SNES', 'plat'], ['Resident Evil 4', 2005, 'GameCube', 'horror'],
    ['World of Warcraft', 2004, 'PC', 'online'], ['God of War', 2018, 'PS4', 'act'], ['Halo: Combat Evolved', 2001, 'Xbox', 'fps'], ['Final Fantasy X', 2001, 'PS2', 'rpg'],
    ['The Last of Us', 2013, 'PS3', 'horror'], ['Super Metroid', 1994, 'SNES', 'plat'], ['Final Fantasy VI', 1994, 'SNES', 'rpg'],
    ['Castlevania: Symphony of the Night', 1997, 'PS1', 'plat'], ['Portal 2', 2011, 'PC', 'puzzle'], ['Mass Effect 2', 2010, 'Xbox 360', 'rpg'], ['Diablo II', 2000, 'PC', 'rpg'],
    ['StarCraft', 1998, 'PC', 'strat'], ['Super Mario Galaxy', 2007, 'Wii', 'plat'], ['Persona 5', 2016, 'PS4', 'rpg'], ['Kingdom Hearts', 2002, 'PS2', 'rpg'],
    ['Sonic the Hedgehog', 1991, 'Mega Drive', 'plat'], ["Baldur's Gate 3", 2023, 'PC', 'rpg']
  ],
  8: [
    ['Donkey Kong', 1981, 'Arcade', 'arcade'], ['Space Invaders', 1978, 'Arcade', 'arcade'], ['Metroid Prime', 2002, 'GameCube', 'fps'], ['Silent Hill 2', 2001, 'PS2', 'horror'],
    ['Shadow of the Colossus', 2005, 'PS2', 'act'], ['Mario Kart 8 Deluxe', 2017, 'Switch', 'race'], ['Counter-Strike', 2000, 'PC', 'fps'], ['Hollow Knight', 2017, 'PC', 'indie'],
    ['Uncharted 2: Il covo dei ladri', 2009, 'PS3', 'act'], ['BioShock', 2007, 'PC', 'fps'], ['Final Fantasy IX', 2000, 'PS1', 'rpg'], ['Dragon Quest XI', 2017, 'PS4', 'rpg'],
    ['Bloodborne', 2015, 'PS4', 'horror'], ['Super Smash Bros. Melee', 2001, 'GameCube', 'fight'], ['Tekken 3', 1998, 'PS1', 'fight'], ['Undertale', 2015, 'PC', 'indie'],
    ['Hades', 2020, 'PC', 'indie'], ['Star Wars: Knights of the Old Republic', 2003, 'Xbox', 'rpg'], ['Metal Gear Solid 3: Snake Eater', 2004, 'PS2', 'stealth'], ['Resident Evil 2', 1998, 'PS1', 'horror']
  ],
  7: [
    ['Final Fantasy VIII', 1999, 'PS1', 'rpg'], ['Final Fantasy Tactics', 1997, 'PS1', 'strat'], ['Kingdom Hearts II', 2005, 'PS2', 'rpg'], ['Xenoblade Chronicles', 2010, 'Wii', 'rpg'],
    ['Persona 4 Golden', 2012, 'PS Vita', 'rpg'], ['Fire Emblem: Three Houses', 2019, 'Switch', 'strat'], ['Monster Hunter: World', 2018, 'PS4', 'act'], ['Sekiro: Shadows Die Twice', 2019, 'PS4', 'stealth'],
    ['Devil May Cry 3', 2005, 'PS2', 'fight'], ['Mass Effect', 2007, 'Xbox 360', 'rpg'], ['Fallout: New Vegas', 2010, 'PC', 'rpg'], ['Deus Ex', 2000, 'PC', 'stealth'],
    ['Age of Empires II', 1999, 'PC', 'strat'], ['Warcraft III', 2002, 'PC', 'strat'], ['Half-Life', 1998, 'PC', 'fps'], ['Portal', 2007, 'PC', 'puzzle'],
    ['Animal Crossing: New Horizons', 2020, 'Switch', 'sandbox'], ['Stardew Valley', 2016, 'PC', 'sandbox'], ['Celeste', 2018, 'PC', 'indie'], ['Overwatch', 2016, 'PC', 'online']
  ],
  6: [
    ['League of Legends', 2009, 'PC', 'online'], ['Fortnite', 2017, 'PC', 'online'], ['The Sims', 2000, 'PC', 'sandbox'], ['Civilization V', 2010, 'PC', 'strat'],
    ['Tomb Raider', 1996, 'PS1', 'act'], ['Crash Bandicoot', 1996, 'PS1', 'plat'], ['Spyro the Dragon', 1998, 'PS1', 'plat'], ['Donkey Kong Country', 1994, 'SNES', 'plat'],
    ['Mega Man 2', 1988, 'NES', 'plat'], ['Castlevania', 1986, 'NES', 'plat'], ['Mortal Kombat', 1992, 'Arcade', 'fight'], ['Gran Turismo', 1997, 'PS1', 'race'],
    ["The Legend of Zelda: Majora's Mask", 2000, 'N64', 'act'], ['Super Mario Bros. 3', 1988, 'NES', 'plat'], ['Pokémon Oro e Argento', 1999, 'Game Boy Color', 'rpg'], ['Okami', 2006, 'PS2', 'act'],
    ['Dragon Quest VIII', 2004, 'PS2', 'rpg'], ['Banjo-Kazooie', 1998, 'N64', 'plat'], ['Batman: Arkham City', 2011, 'PC', 'act'], ["Assassin's Creed II", 2009, 'PC', 'stealth']
  ],
  5: [
    ['Call of Duty 4: Modern Warfare', 2007, 'PC', 'fps'], ['Borderlands 2', 2012, 'PC', 'fps'], ['Far Cry 3', 2012, 'PC', 'fps'], ['Rocket League', 2015, 'PC', 'sport'],
    ['Among Us', 2018, 'PC', 'online'], ['Terraria', 2011, 'PC', 'sandbox'], ['Cuphead', 2017, 'PC', 'indie'], ['Ori and the Blind Forest', 2015, 'PC', 'indie'],
    ['Journey', 2012, 'PS3', 'indie'], ['Limbo', 2010, 'PC', 'puzzle'], ['Kirby Super Star', 1996, 'SNES', 'plat'], ['Rayman', 1995, 'PS1', 'plat'],
    ['Sonic Adventure', 1998, 'Dreamcast', 'plat'], ['Soulcalibur', 1998, 'Dreamcast', 'fight'], ['Heroes of Might and Magic III', 1999, 'PC', 'strat'], ['Command & Conquer: Red Alert', 1996, 'PC', 'strat'],
    ['RollerCoaster Tycoon', 1999, 'PC', 'strat'], ['SimCity 2000', 1993, 'PC', 'strat'], ["Marvel's Spider-Man", 2018, 'PS4', 'act'], ['Ghost of Tsushima', 2020, 'PS4', 'stealth']
  ],
  4: [
    ['Horizon Zero Dawn', 2017, 'PS4', 'act'], ['Cyberpunk 2077', 2020, 'PC', 'rpg'], ['Dragon Age: Origins', 2009, 'PC', 'rpg'], ['Fallout 4', 2015, 'PC', 'rpg'],
    ['Left 4 Dead 2', 2009, 'PC', 'horror'], ['Team Fortress 2', 2007, 'PC', 'fps'], ['Dota 2', 2013, 'PC', 'online'], ['Apex Legends', 2019, 'PC', 'online'],
    ['It Takes Two', 2021, 'PC', 'plat'], ['Inside', 2016, 'PC', 'puzzle'], ['Shovel Knight', 2014, 'PC', 'indie'], ['Plants vs. Zombies', 2009, 'PC', 'strat'],
    ['Guitar Hero III', 2007, 'PS2', 'arcade'], ['Wii Sports', 2006, 'Wii', 'sport'], ['Mario Party', 1998, 'N64', 'arcade'], ['Crash Team Racing', 1999, 'PS1', 'race'],
    ['Metal Slug', 1996, 'Arcade', 'arcade'], ['Final Fight', 1989, 'Arcade', 'fight'], ['Streets of Rage 2', 1992, 'Mega Drive', 'fight'], ['Contra', 1987, 'NES', 'arcade']
  ],
  3: [
    ['Angry Birds', 2009, 'Mobile', 'mobile'], ['Candy Crush Saga', 2012, 'Mobile', 'mobile'], ['Fruit Ninja', 2010, 'Mobile', 'mobile'], ['Subway Surfers', 2012, 'Mobile', 'mobile'],
    ['Clash of Clans', 2012, 'Mobile', 'mobile'], ['Pokémon GO', 2016, 'Mobile', 'mobile'], ['Roblox', 2006, 'PC', 'online'], ['Fall Guys', 2020, 'PC', 'online'],
    ["Five Nights at Freddy's", 2014, 'PC', 'horror'], ['Dead Space', 2008, 'PC', 'horror'], ['Gears of War', 2006, 'Xbox 360', 'fps'], ['Prince of Persia', 1989, 'PC', 'plat'],
    ['Lemmings', 1991, 'PC', 'puzzle'], ['Worms', 1995, 'PC', 'strat'], ['Bomberman', 1983, 'NES', 'arcade'], ['Golden Axe', 1989, 'Arcade', 'fight'],
    ['Out Run', 1986, 'Arcade', 'race'], ["Ghosts 'n Goblins", 1985, 'Arcade', 'plat'], ['Bubble Bobble', 1986, 'Arcade', 'arcade'], ['Puzzle Bobble', 1994, 'Arcade', 'puzzle']
  ],
  2: [
    ['Pong', 1972, 'Arcade', 'arcade'], ['Asteroids', 1979, 'Arcade', 'arcade'], ['Galaga', 1981, 'Arcade', 'arcade'], ['Frogger', 1981, 'Arcade', 'arcade'],
    ['Centipede', 1981, 'Arcade', 'arcade'], ['Dig Dug', 1982, 'Arcade', 'arcade'], ['Q*bert', 1982, 'Arcade', 'arcade'], ['Pitfall!', 1982, 'Atari 2600', 'plat'],
    ['Duck Hunt', 1984, 'NES', 'arcade'], ['Excitebike', 1984, 'NES', 'race'], ['Snake', 1997, 'Nokia', 'mobile'], ['Flappy Bird', 2013, 'Mobile', 'mobile'],
    ['Temple Run', 2011, 'Mobile', 'mobile'], ['Doodle Jump', 2009, 'Mobile', 'mobile'], ['Geometry Dash', 2013, 'Mobile', 'mobile'], ['Crossy Road', 2014, 'Mobile', 'mobile'],
    ['Arkanoid', 1986, 'Arcade', 'arcade'], ['Double Dragon', 1987, 'Arcade', 'fight'], ['Punch-Out!!', 1987, 'NES', 'fight'], ['R-Type', 1987, 'Arcade', 'arcade']
  ],
  1: [
    ['Breakout', 1976, 'Arcade', 'arcade'], ['Campo minato', 1990, 'PC', 'puzzle'], ['Solitario', 1990, 'PC', 'puzzle'], ['3D Pinball Space Cadet', 1995, 'PC', 'arcade'],
    ['2048', 2014, 'Mobile', 'puzzle'], ['Cut the Rope', 2010, 'Mobile', 'mobile'], ['Mario Bros.', 1983, 'Arcade', 'arcade'], ['Donkey Kong Jr.', 1982, 'Arcade', 'arcade'],
    ['Missile Command', 1980, 'Arcade', 'arcade'], ['Joust', 1982, 'Arcade', 'arcade'], ['Defender', 1981, 'Arcade', 'arcade'], ['Paperboy', 1985, 'Arcade', 'arcade'],
    ['Ice Climber', 1985, 'NES', 'plat'], ['Balloon Fight', 1985, 'NES', 'arcade'], ['Kid Icarus', 1986, 'NES', 'plat'], ['Altered Beast', 1988, 'Arcade', 'fight'],
    ['E.T. the Extra-Terrestrial', 1982, 'Atari 2600', 'arcade'], ['BurgerTime', 1982, 'Arcade', 'arcade'], ['Spy Hunter', 1983, 'Arcade', 'race'], ['Pole Position', 1982, 'Arcade', 'race']
  ]
};
