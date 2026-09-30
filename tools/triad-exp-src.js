// Espansioni (DLC) del Triple Triad: ogni espansione ha 30 carte (3 per livello) e si sblocca a un livello del giocatore.
// Per aggiungerne una nuova: aggiungi qui un blocco, lancia `node tools/build-triad-cards.js` e poi `node tools/build-triad-art.js`; server e app la trovano da soli.
// Formato carta: [nome, anno, piattaforma, genere]. NON cambiare i nomi dopo la pubblicazione (l'id deriva dal nome).
module.exports = [
  {id: 'jrpg', name: 'Sogni JRPG', emoji: '🗡️', desc: 'I grandi classici dei giochi di ruolo giapponesi.', level: 1, cards: {
    10: [['Final Fantasy IV', 1991, 'SNES', 'rpg'], ['Dragon Quest III', 1988, 'NES', 'rpg'], ['Chrono Cross', 1999, 'PS1', 'rpg']],
    9: [['Final Fantasy V', 1992, 'SNES', 'rpg'], ['Dragon Quest IV', 1990, 'NES', 'rpg'], ['Suikoden II', 1998, 'PS1', 'rpg']],
    8: [['EarthBound', 1994, 'SNES', 'rpg'], ['Xenogears', 1998, 'PS1', 'rpg'], ['Tales of Symphonia', 2003, 'GameCube', 'rpg']],
    7: [['Final Fantasy XII', 2006, 'PS2', 'rpg'], ['Secret of Mana', 1993, 'SNES', 'rpg'], ['Valkyrie Profile', 1999, 'PS1', 'rpg']],
    6: [['Ni no Kuni', 2011, 'PS3', 'rpg'], ['Octopath Traveler', 2018, 'Switch', 'rpg'], ['Tales of Vesperia', 2008, 'Xbox 360', 'rpg']],
    5: [['Final Fantasy XV', 2016, 'PS4', 'rpg'], ['Bravely Default', 2012, '3DS', 'rpg'], ['Dragon Quest Builders 2', 2018, 'Switch', 'sandbox']],
    4: [['Lost Odyssey', 2007, 'Xbox 360', 'rpg'], ['Star Ocean: The Second Story', 1998, 'PS1', 'rpg'], ['Grandia', 1997, 'Saturn', 'rpg']],
    3: [['Legend of Dragoon', 1999, 'PS1', 'rpg'], ['Breath of Fire III', 1997, 'PS1', 'rpg'], ['Vagrant Story', 2000, 'PS1', 'rpg']],
    2: [['Final Fantasy Mystic Quest', 1992, 'SNES', 'rpg'], ['Pokémon Mystery Dungeon', 2005, 'DS', 'rpg'], ['Digimon World', 1999, 'PS1', 'rpg']],
    1: [['Final Fantasy Crystal Chronicles', 2003, 'GameCube', 'rpg'], ['Pokémon Pinball', 1999, 'Game Boy Color', 'arcade'], ['Final Fantasy Adventure', 1991, 'Game Boy', 'rpg']]
  }},
  {id: 'retro', name: 'Arcade & Retro', emoji: '🕹️', desc: 'Gettoni, sale giochi e console di una volta.', level: 5, cards: {
    10: [['Sonic the Hedgehog 2', 1992, 'Mega Drive', 'plat'], ['Super Mario Kart', 1992, 'SNES', 'race'], ['Mega Man X', 1993, 'SNES', 'plat']],
    9: [['GoldenEye 007', 1997, 'N64', 'fps'], ['Earthworm Jim', 1994, 'Mega Drive', 'plat'], ['Gradius', 1985, 'Arcade', 'arcade']],
    8: [['Daytona USA', 1994, 'Arcade', 'race'], ['Virtua Fighter 2', 1994, 'Arcade', 'fight'], ['Ridge Racer', 1993, 'PS1', 'race']],
    7: [['Sonic Mania', 2017, 'PC', 'plat'], ['Strider', 1989, 'Arcade', 'act'], ['Pilotwings 64', 1996, 'N64', 'sport']],
    6: [['Rampage', 1986, 'Arcade', 'arcade'], ['NBA Jam', 1993, 'Arcade', 'sport'], ['Tony Hawk\'s Pro Skater 2', 2000, 'PS1', 'sport']],
    5: [['Pro Evolution Soccer 6', 2006, 'PS2', 'sport'], ['Time Pilot', 1982, 'Arcade', 'arcade'], ['Gauntlet', 1985, 'Arcade', 'arcade']],
    4: [['Track & Field', 1983, 'Arcade', 'sport'], ['Sonic Adventure 2', 2001, 'Dreamcast', 'plat'], ['Marble Madness', 1984, 'Arcade', 'arcade']],
    3: [['Space Harrier', 1985, 'Arcade', 'arcade'], ['Elevator Action', 1983, 'Arcade', 'arcade'], ['Pengo', 1982, 'Arcade', 'arcade']],
    2: [['Zaxxon', 1982, 'Arcade', 'arcade'], ['Tempest', 1981, 'Arcade', 'arcade'], ['Robotron 2084', 1982, 'Arcade', 'arcade']],
    1: [['Tapper', 1983, 'Arcade', 'arcade'], ['Popeye', 1982, 'Arcade', 'arcade'], ['Mappy', 1983, 'Arcade', 'arcade']]
  }},
  {id: 'horror', name: 'Notte Horror', emoji: '👻', desc: 'Per chi gioca con la luce spenta.', level: 10, cards: {
    10: [['Resident Evil', 1996, 'PS1', 'horror'], ['Silent Hill', 1999, 'PS1', 'horror'], ['Alien: Isolation', 2014, 'PC', 'horror']],
    9: [['Amnesia: The Dark Descent', 2010, 'PC', 'horror'], ['Resident Evil 7', 2017, 'PC', 'horror'], ['Dead Space 2', 2011, 'PC', 'horror']],
    8: [['Alan Wake', 2010, 'Xbox 360', 'horror'], ['Outlast', 2013, 'PC', 'horror'], ['Silent Hill 3', 2003, 'PS2', 'horror']],
    7: [['Fatal Frame', 2001, 'PS2', 'horror'], ['Layers of Fear', 2016, 'PC', 'horror'], ['Until Dawn', 2015, 'PS4', 'horror']],
    6: [['Clock Tower', 1995, 'SNES', 'horror'], ['The Evil Within', 2014, 'PC', 'horror'], ['Little Nightmares', 2017, 'PC', 'horror']],
    5: [['Alone in the Dark', 1992, 'PC', 'horror'], ['Dino Crisis', 1999, 'PS1', 'horror'], ['Condemned: Criminal Origins', 2005, 'Xbox 360', 'horror']],
    4: [['Resident Evil Village', 2021, 'PC', 'horror'], ['Phasmophobia', 2020, 'PC', 'horror'], ['Dead by Daylight', 2016, 'PC', 'horror']],
    3: [['Poppy Playtime', 2021, 'PC', 'horror'], ['Bendy and the Ink Machine', 2017, 'PC', 'horror'], ['Slender: The Eight Pages', 2012, 'PC', 'horror']],
    2: [['Haunting Ground', 2005, 'PS2', 'horror'], ['Sweet Home', 1989, 'NES', 'horror'], ['Luigi\'s Mansion', 2001, 'GameCube', 'horror']],
    1: [['Ghostbusters', 1984, 'PC', 'arcade'], ['Splatterhouse', 1988, 'Arcade', 'act'], ['Night Trap', 1992, 'PC', 'horror']]
  }},
  {id: 'indie', name: 'Indie & Cult', emoji: '🌱', desc: 'Piccoli studi, grandi idee.', level: 15, cards: {
    10: [['Super Meat Boy', 2010, 'PC', 'indie'], ['Braid', 2008, 'PC', 'indie'], ['The Binding of Isaac', 2011, 'PC', 'indie']],
    9: [['Disco Elysium', 2019, 'PC', 'rpg'], ['Outer Wilds', 2019, 'PC', 'indie'], ['Slay the Spire', 2019, 'PC', 'indie']],
    8: [['Return of the Obra Dinn', 2018, 'PC', 'indie'], ['Baba Is You', 2019, 'PC', 'puzzle'], ['Dead Cells', 2018, 'PC', 'indie']],
    7: [['Katana ZERO', 2019, 'PC', 'indie'], ['Hotline Miami', 2012, 'PC', 'indie'], ['Untitled Goose Game', 2019, 'PC', 'indie']],
    6: [['RimWorld', 2018, 'PC', 'strat'], ['Factorio', 2016, 'PC', 'strat'], ['Don\'t Starve', 2013, 'PC', 'indie']],
    5: [['Firewatch', 2016, 'PC', 'indie'], ['Gris', 2018, 'PC', 'indie'], ['A Short Hike', 2019, 'PC', 'indie']],
    4: [['Spelunky', 2012, 'PC', 'indie'], ['FTL: Faster Than Light', 2012, 'PC', 'strat'], ['Darkest Dungeon', 2016, 'PC', 'rpg']],
    3: [['Vampire Survivors', 2022, 'PC', 'indie'], ['Getting Over It', 2017, 'PC', 'indie'], ['Cult of the Lamb', 2022, 'PC', 'indie']],
    2: [['Kerbal Space Program', 2015, 'PC', 'sandbox'], ['Superhot', 2016, 'PC', 'fps'], ['Human: Fall Flat', 2016, 'PC', 'puzzle']],
    1: [['Cookie Clicker', 2013, 'PC', 'indie'], ['Minit', 2018, 'PC', 'indie'], ['Thomas Was Alone', 2012, 'PC', 'puzzle']]
  }}
];
