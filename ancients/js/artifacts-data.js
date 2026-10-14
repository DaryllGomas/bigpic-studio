// Artifacts data with detailed information
const artifactsData = {
    "mysterious-handbags": {
        title: "Mysterious Handbag Symbols",
        era: "Multiple Civilizations • 9600 BCE - 500 CE",
        images: [
            "images/Artifacts/Mysterious/handbags.jpg",  // Ancient relief carving showing the symbol
            "images/Artifacts/Mysterious/manybags.jpg"   // Compilation showing multiple cultural examples
        ],
        overview: "One of the most intriguing mysteries in ancient art is the recurring appearance of handbag-like objects in the iconography of disparate civilizations separated by vast distances and over 10,000 years of time. From Göbekli Tepe to Mesoamerica, from Sumeria to ancient Egypt, the same distinctive shape appears in the hands of gods, priests, and mythical beings.",
        context: "The 'handbag' symbol appears prominently across cultures: Göbekli Tepe, Turkey (9600 BCE) - carved on Pillar 43; Sumerian relief carvings from Mesopotamia (c. 3000 BCE) - carried by Anunnaki figures; Olmec stone carvings at La Venta, Mexico (c. 900 BCE); Assyrian palace reliefs showing winged beings; Egyptian hieroglyphs and tomb paintings; Toltec and Aztec depictions from Mexico; and Maori wood carvings in New Zealand. The geographical and temporal spread defies simple cultural transmission.",
        significance: "In conventional archaeology, these objects are often interpreted as ritual buckets or containers used in religious ceremonies. The Sumerians called them 'banduddu' - buckets used to carry sacred water. However, the consistent depiction across cultures suggests: A shared symbolic meaning, possible evidence of ancient global contact or influence, representation of an important object or concept, or potential religious/spiritual significance that transcended cultural boundaries.",
        mysteries: "Why does this specific symbol appear in so many unconnected ancient cultures? The similarities are too specific to be coincidental - the handle, proportions, and context of use are remarkably consistent. Were these cultures in contact? Did they inherit this symbol from a common older source? What was so important about these objects that they appear in the most sacred contexts - in temples, tombs, and in the hands of deities? The mystery deepens when we consider that mainstream archaeology has no satisfactory explanation for this phenomenon.",
        category: ["mysterious"]
    },
    "egyptian-cartouches": {
        title: "Egyptian Royal Cartouches",
        era: "Ancient Egypt • 3100-30 BCE",
        image: "images/Artifacts/Mysterious/Cartouche-obelisk-Hatshepsut-Egypt-Luxor.webp",
        overview: "Cartouches are oval-shaped hieroglyphic inscriptions that enclosed the names of Egyptian pharaohs and queens. These sacred symbols were believed to protect the royal name from evil spirits in life and death.",
        context: "The cartouche, known in ancient Egyptian as 'shenu', evolved from the earlier 'shen' ring symbol representing eternity and protection. First appearing in the Fourth Dynasty (c. 2613-2494 BCE), cartouches became the standard way to denote royal names. The example shown is from Queen Hatshepsut's mortuary temple at Luxor.",
        significance: "Cartouches served multiple purposes: They distinguished royal names from other text in inscriptions, provided magical protection for the pharaoh's name, helped modern Egyptologists identify and date monuments and artifacts, and were key to deciphering hieroglyphics via the Rosetta Stone.",
        mysteries: "Some cartouches contain cryptographic writings that scholars still debate. Why did some pharaohs have multiple cartouche names? What is the significance of cartouches found in unexpected locations far from Egypt? The practice of enclosing names in protective symbols appears in other cultures too - is there a connection?",
        category: ["art"]
    },
    "bronze-age-swords": {
        title: "Bronze Age Swords",
        era: "Bronze Age • 3000-1200 BCE",
        image: "images/timeline/bronze_age/artifacts/Latenium-epees-bronze.webp",
        overview: "These bronze swords from the Late Bronze Age represent a pinnacle of ancient metallurgical achievement. Found at various sites across Europe, they demonstrate sophisticated casting techniques and artistic design.",
        context: "The Bronze Age saw a revolution in warfare with the development of bronze weapons. These swords, dating from approximately 1300-1000 BCE, were cast using advanced techniques including the lost-wax method. They were not merely functional weapons but also symbols of status and power, often buried with warriors or deposited in rivers as votive offerings.",
        significance: "These artifacts demonstrate: Advanced knowledge of alloy composition (typically 88% copper, 12% tin), sophisticated casting techniques requiring temperatures over 1000°C, standardized designs suggesting organized production and trade networks, and the social stratification of Bronze Age societies where such weapons indicated elite warrior status.",
        mysteries: null,
        category: ["tools"]
    },
    "paleolithic-hand-axe": {
        title: "Paleolithic Hand Axe",
        era: "Lower Paleolithic • 1.76 million - 130,000 BCE",
        image: "images/Artifacts/Tools_Weapons/Early-human-hand-axe-008.jpg",
        overview: "The Acheulean hand axe represents one of humanity's longest-used tool designs, remaining virtually unchanged for over 1.5 million years. These teardrop-shaped tools are found across Africa, Europe, and Asia.",
        context: "Named after Saint-Acheul in France where they were first discovered, these bifacially worked tools were created by Homo erectus and later Homo heidelbergensis. The remarkable consistency in their design across vast distances and time periods suggests either cultural transmission or convergent evolution of an optimal design.",
        significance: "Hand axes represent several major cognitive leaps: The ability to conceive and execute a symmetrical design, planning and foresight in tool production, possible aesthetic sense (many are more refined than functionally necessary), and the first evidence of tool-making traditions passed down through generations. They were likely multipurpose tools used for butchering, woodworking, and digging.",
        mysteries: null,
        category: ["tools"]
    },
    "venus-figurines": {
        title: "Venus Figurines",
        era: "Upper Paleolithic • 35,000-9,000 BCE",
        image: "images/Artifacts/Art_Symbols/Newsflash-OriginFigurineVenus-021-575x1024.jpg",
        overview: "Venus figurines are prehistoric statuettes depicting women, characterized by exaggerated sexual features. Over 200 such figurines have been found across Europe and parts of Asia, representing some of humanity's earliest art.",
        context: "These figurines, including famous examples like the Venus of Willendorf and Venus of Dolní Věstonice, were created by hunter-gatherer societies during the last Ice Age. Made from various materials including ivory, stone, and clay, they share remarkably similar stylistic features despite being separated by thousands of miles and millennia.",
        significance: "Venus figurines provide insight into: Paleolithic artistic traditions and symbolic thinking, possible religious or spiritual beliefs of early humans, concepts of fertility, femininity, or goddess worship, and evidence of shared cultural ideas across vast prehistoric networks. Their ubiquity suggests they held important meaning for Ice Age peoples.",
        mysteries: "Why do these figurines share such similar characteristics across such vast distances and time periods? Were they fertility symbols, goddess figures, or self-portraits by women? Why are facial features typically absent or abstracted? Some researchers note their proportions match the perspective of a pregnant woman looking down at her own body - could they be self-representations?",
        category: ["art"]
    }
};

// Future artifacts that could be added
const futureArtifacts = {
    "antikythera-mechanism": {
        title: "Antikythera Mechanism",
        era: "Ancient Greece • c. 100 BCE",
        description: "An ancient analog computer used to predict astronomical positions",
        category: ["mysterious", "tools"]
    },
    "baghdad-battery": {
        title: "Baghdad Battery",
        era: "Parthian Period • c. 250 BCE",
        description: "Possible ancient electrical device found in Iraq",
        category: ["mysterious", "tools"]
    },
    "crystal-skulls": {
        title: "Crystal Skulls",
        era: "Unknown • Disputed",
        description: "Carved quartz skulls of disputed origin and age",
        category: ["mysterious", "art"]
    },
    "nazca-lines": {
        title: "Nazca Lines",
        era: "Nazca Culture • 500 BCE - 500 CE",
        description: "Giant geoglyphs in Peru visible only from the air",
        category: ["mysterious", "art"]
    },
    "phaistos-disc": {
        title: "Phaistos Disc",
        era: "Minoan Civilization • c. 1700 BCE",
        description: "Clay disc with undeciphered spiral script",
        category: ["mysterious", "art"]
    }
};
