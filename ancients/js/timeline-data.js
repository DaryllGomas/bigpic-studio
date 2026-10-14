/**
 * Timeline Data Structure
 * Comprehensive data for the Ancient History timeline
 */

const timelineData = {
    // Prehistoric Period (300,000 - 24,000 BCE)
    "prehistoric": {
        title: "Prehistoric Period",
        period: "300,000 - 24,000 BCE",
        description: "The earliest period of human history before the development of writing systems",
        events: [
            {
                year: "300,000 BCE",
                shortDesc: "Origin of Homo sapiens",
                title: "Emergence of Humans",
                description: "Homo sapiens appear in Africa",
                details: "Fossil evidence suggests that Homo sapiens evolved in Africa around 300,000 years ago. The oldest known fossils were discovered in Jebel Irhoud, Morocco.",
                keyFigures: ["Early Homo sapiens"],
                culturalContext: "Early humans lived in small nomadic groups, using simple stone tools and developing early forms of communication.",
                locations: ["Africa", "Morocco"],
                artifacts: ["Stone tools", "Early human fossils"],
                imageFolder: "prehistoric"
            },
            {
                year: "70,000 BCE",
                shortDesc: "Early symbolic thought",
                title: "Early Human Art",
                description: "Earliest evidence of symbolic thought and artistic expression",
                details: "Archaeological evidence from sites like Blombos Cave in South Africa shows early humans creating geometric engravings and using ochre for symbolic purposes.",
                keyFigures: [],
                culturalContext: "The development of symbolic thinking represents a major cognitive advancement in human evolution, possibly connected to language development.",
                locations: ["South Africa", "Blombos Cave"],
                artifacts: ["Ochre engravings", "Shell beads"],
                imageFolder: "prehistoric"
            },
            {
                year: "40,000 BCE",
                shortDesc: "Cave art flourishes",
                title: "Cave Paintings",
                description: "Remarkable cave paintings appear in Europe (Lascaux, Chauvet)",
                details: "The caves of Lascaux in France and Chauvet contain some of the most well-preserved prehistoric paintings, depicting animals, human figures, and abstract symbols.",
                keyFigures: ["Cro-Magnon artists"],
                culturalContext: "These paintings likely had ritual or spiritual significance, possibly related to hunting magic or shamanic practices.",
                locations: ["France", "Lascaux", "Chauvet"],
                artifacts: ["Cave paintings", "Pigments", "Hand stencils"],
                imageFolder: "prehistoric/cave_paintings"
            },
            {
                year: "35,000 BCE",
                shortDesc: "Paleolithic sculpture",
                title: "Venus Figurines",
                description: "Small statuettes of women with exaggerated features appear across Europe",
                details: "These figurines, often called 'Venus' figurines, typically emphasize female reproductive features and may have been fertility symbols or representations of goddesses.",
                keyFigures: [],
                culturalContext: "The widespread nature of these figurines suggests shared cultural or religious concepts across different human groups.",
                locations: ["Europe", "Russia", "France", "Austria"],
                artifacts: ["Venus of Willendorf", "Venus of Hohle Fels"],
                imageFolder: "prehistoric/venus_figurines"
            },
            {
                year: "15,000 BCE",
                shortDesc: "Advanced hunting tools",
                title: "Technological Innovations",
                description: "Development of specialized hunting tools like spear-throwers and harpoons",
                details: "Late Paleolithic humans developed increasingly sophisticated hunting technologies, including the atlatl (spear-thrower) which effectively extended the human arm, allowing for greater force and distance in spear throwing.",
                keyFigures: [],
                culturalContext: "These technological advances improved hunting success and efficiency, supporting larger human populations and more complex social structures.",
                locations: ["Global", "Europe", "Americas"],
                artifacts: ["Atlatls", "Harpoons", "Bone needles"],
                imageFolder: "prehistoric/stone_tools"
            },
            {
                year: "~18,000 BCE",
                shortDesc: "Magdalenian Culture",
                title: "EUROPE", 
                description: "Flourishing of the Magdalenian culture in Western Europe, known for sophisticated bone/antler tools and renowned cave art (e.g., Lascaux, Altamira).",
                details: "Placeholder: More details about Magdalenian culture, tools, and art.",
                keyFigures: [],
                culturalContext: "Placeholder: Cultural context of Magdalenian period.",
                locations: ["Western Europe", "France", "Spain"],
                artifacts: ["Sophisticated bone tools", "Antler tools", "Cave paintings"],
                imageFolder: "prehistoric"
            },
            {
                year: "~12,700 BCE",
                shortDesc: "Bølling-Allerød Warming",
                title: "GLOBAL CLIMATE", 
                description: "A relatively warm and moist interstadial period during the final stages of the Last Glacial Period.",
                details: "Placeholder: More details about the Bølling-Allerød warming period and its effects.",
                keyFigures: [],
                culturalContext: "Placeholder: Impact on human populations and environments.",
                locations: ["Global"],
                artifacts: [],
                imageFolder: "prehistoric"
            },
            {
                year: "~10,900 BCE",
                shortDesc: "Younger Dryas Begins",
                title: "GLOBAL CLIMATE", 
                description: "Rapid return to glacial conditions which temporarily reversed the gradual climatic warming after the Last Glacial Maximum.",
                details: "Placeholder: More details about the onset of the Younger Dryas.",
                keyFigures: [],
                culturalContext: "Placeholder: Significant impact on ecosystems and human societies adapting to the warming trend.",
                locations: ["Global", "Northern Hemisphere"],
                artifacts: [],
                imageFolder: "prehistoric"
            },
            {
                year: "~10,900 BCE",
                shortDesc: "Impact Event (Theoretical)",
                title: "NORTH AMERICA [THEORETICAL]", 
                description: "Hypothesized comet/asteroid impact or airburst event proposed as a trigger for the Younger Dryas cooling and associated environmental changes.",
                details: "Placeholder: More details about the Younger Dryas impact hypothesis, evidence, and controversies.",
                keyFigures: [],
                culturalContext: "Placeholder: Potential catastrophic effects on North American megafauna and Paleo-Indian cultures like Clovis.",
                locations: ["North America (epicenter debated)"],
                artifacts: ["Nanodiamonds", "Spherules", "Platinum anomalies (debated)"],
                imageFolder: "prehistoric"
            },
            {
                year: "~10,800 BCE",
                shortDesc: "Megafauna/Clovis Changes",
                title: "NORTH AMERICA", 
                description: "Major extinction event for large mammals (megafauna) and significant changes or decline in the Clovis paleo-Indian culture.",
                details: "Placeholder: More details on the megafauna extinction and the cultural shifts observed in the archaeological record around this time.",
                keyFigures: [],
                culturalContext: "Placeholder: Debate on causes - climate change, human hunting (overkill hypothesis), impact event, or combination.",
                locations: ["North America"],
                artifacts: ["Clovis points", "Megafauna fossils"],
                imageFolder: "prehistoric"
            },
            {
                year: "~9,700 BCE",
                shortDesc: "End of Younger Dryas",
                title: "GLOBAL CLIMATE", 
                description: "Abrupt end of the Younger Dryas cold period and return to warmer conditions, marking the beginning of the Holocene epoch.",
                details: "Placeholder: More details about the rapid warming at the end of the Younger Dryas.",
                keyFigures: [],
                culturalContext: "Placeholder: Paved the way for the development of agriculture and settled societies in the Holocene.",
                locations: ["Global"],
                artifacts: [],
                imageFolder: "prehistoric"
            }
        ]
    },

    // Pre-Pottery Neolithic (9,600 - 7,000 BCE) - Renamed to Early Neolithic
    "earlyNeolithic": { 
        title: "Early Neolithic Revolution", 
        period: "10,000 - 5,000 BCE", 
        description: "Period marking the beginning of agriculture, permanent settlements, and monumental structures, leading to profound changes in human society.", 
        events: [
            {
                year: "9500 BCE", 
                shortDesc: "World's oldest temple",
                title: "Göbekli Tepe",
                description: "Construction of massive stone pillars arranged in circles with carved animals and symbols in modern-day Turkey",
                details: "Göbekli Tepe consists of massive stone pillars arranged in circles, many decorated with carvings of animals and abstract symbols. The site predates pottery, metallurgy, writing, and even farming.",
                keyFigures: [],
                culturalContext: "The construction of Göbekli Tepe suggests complex social organization and religious practices before the development of agriculture, challenging previous theories about the development of civilization.",
                locations: ["Turkey", "Anatolia"],
                artifacts: ["T-shaped pillars", "Stone carvings", "Animal reliefs"],
                imageFolder: "neolithic/gobekli_tepe"
            },
            {
                year: "9000 BCE", 
                shortDesc: "Agricultural beginnings",
                title: "Fertile Crescent",
                description: "First evidence of deliberate cultivation of wild grains like wheat and barley in the Middle East",
                details: "Early farmers in the Fertile Crescent began cultivating wild grains like wheat and barley, and domesticating animals such as goats and sheep, leading to the first settled agricultural communities.",
                keyFigures: [],
                culturalContext: "The shift to agriculture fundamentally changed human society, allowing for permanent settlements, population growth, food surpluses, and eventually social stratification.",
                locations: ["Middle East", "Mesopotamia", "Levant"],
                artifacts: ["Early sickles", "Grinding stones", "Storage containers"],
                imageFolder: "neolithic"
            },
            {
                year: "8500 BCE", 
                shortDesc: "Early settlement",
                title: "Jericho",
                description: "Development of one of the world's oldest continuously inhabited settlements with protective walls and a tower",
                details: "Archaeological evidence shows that Jericho (Tell es-Sultan) was a fortified settlement with a stone tower and walls by 8500 BCE, making it one of the earliest examples of monumental defensive architecture.",
                keyFigures: [],
                culturalContext: "The massive fortifications at Jericho suggest organized defense and communal labor on a scale previously unseen, indicating emerging social complexity and possibly hierarchy.",
                locations: ["Levant", "Palestine", "Jordan Valley"],
                artifacts: ["Stone tower", "Defensive walls", "Round houses"],
                imageFolder: "neolithic"
            },
            {
                year: "8000 BCE", 
                shortDesc: "Animal domestication",
                title: "Southwest Asia",
                description: "Evidence of early domestication of sheep, goats, and other animals for food, materials, and labor",
                details: "By 8000 BCE, there is clear evidence of morphological changes in sheep and goats indicating domestication. These animals provided reliable sources of meat, milk, wool, and labor.",
                keyFigures: [],
                culturalContext: "Animal domestication created a more secure food supply and provided new resources for clothing, tools, and transportation, fundamentally altering human relationships with the environment.",
                locations: ["Southwest Asia", "Zagros Mountains", "Anatolia"],
                artifacts: ["Animal remains", "Corrals", "Bone tools"],
                imageFolder: "neolithic"
            },
            {
                year: "8000 BCE",
                shortDesc: "Domestication of Cattle",
                title: "NEAR EAST", 
                description: "Domestication of cattle for meat, milk, and labor in the Near East region",
                details: "By 8000 BCE, there is clear evidence of morphological changes indicating cattle domestication. These animals provided reliable sources of meat, milk, and labor.",
                keyFigures: [],
                culturalContext: "Animal domestication created a more secure food supply and provided new resources, fundamentally altering human relationships with the environment.",
                locations: ["Near East", "Anatolia"],
                artifacts: ["Animal remains", "Corrals", "Bone tools"],
                imageFolder: "neolithic"
            },
            {
                year: "8000 BCE",
                shortDesc: "Göbekli Tepe Buried",
                title: "ANATOLIA", 
                description: "The monumental structures at Göbekli Tepe were deliberately and carefully buried.",
                details: "Placeholder: Details about the intentional backfilling of Göbekli Tepe, methods, and possible reasons.",
                keyFigures: [],
                culturalContext: "Placeholder: The burial itself is a significant cultural act, suggesting changing beliefs or the end of a specific ritual period.",
                locations: ["Turkey", "Anatolia", "Göbekli Tepe"],
                artifacts: ["Backfill material", "Analysis of burial layers"],
                imageFolder: "neolithic/gobekli_tepe"
            },
            {
                year: "7000 BCE", 
                shortDesc: "Large settlement",
                title: "Çatalhöyük",
                description: "Large Neolithic settlement in Anatolia with houses built adjacent to each other and entered through roofs",
                details: "Çatalhöyük was a large Neolithic settlement in southern Anatolia, with houses built directly adjacent to each other with no streets or pathways between them. Residents entered their homes through holes in the roof.",
                keyFigures: [],
                culturalContext: "The site provides insights into early urban living, with evidence of complex religious practices, art, and craft specialization.",
                locations: ["Turkey", "Anatolia"],
                artifacts: ["Wall paintings", "Female figurines", "Obsidian tools"],
                imageFolder: "neolithic/settlements"
            },
            {
                year: "6500 BCE", 
                shortDesc: "Ceramic technology",
                title: "Pottery Innovation",
                description: "Widespread adoption of fired pottery for storage, cooking, and artistic expression across the Near East",
                details: "The invention of pottery allowed for better food storage and new cooking methods. Early pottery was often decorated with geometric patterns and later with representations of animals and humans.",
                keyFigures: [],
                culturalContext: "Pottery production represents an important technological advancement that facilitated the storage of agricultural surpluses and the cooking of new types of food.",
                locations: ["Middle East", "East Asia", "Africa"],
                artifacts: ["Storage jars", "Cooking vessels", "Decorated bowls"],
                imageFolder: "neolithic/pottery"
            },
            {
                year: "6200 BCE", 
                shortDesc: "Farming spread",
                title: "European Expansion",
                description: "Agricultural techniques and domesticated crops spread into Europe through the Balkans and along the Mediterranean",
                details: "The Neolithic way of life spread into Europe from Anatolia and the Near East, bringing domesticated plants, animals, and the knowledge of pottery making and settled agriculture.",
                keyFigures: [],
                culturalContext: "The spread of agriculture into Europe represents one of the most significant demographic and cultural transformations in human history, eventually replacing hunting and gathering as the dominant lifestyle.",
                locations: ["Balkans", "Greece", "Mediterranean", "Europe"],
                artifacts: ["Farming tools", "Settlement remains", "Early European pottery"],
                imageFolder: "neolithic"
            },
            {
                year: "5900 BCE", 
                shortDesc: "Proto-cities emerge",
                title: "Social Stratification",
                description: "Larger settlements show evidence of specialized crafts, social hierarchies, and organized public spaces",
                details: "As settlements grew in size and complexity, evidence emerges of specialized craft production, trade networks, and social differentiation indicated by variations in burial goods and housing quality.",
                keyFigures: [],
                culturalContext: "These early forms of social complexity laid the groundwork for the subsequent development of more formalized hierarchies and eventually state-level societies in the following millennia.",
                locations: ["Near East", "Mesopotamia", "Balkans"],
                artifacts: ["Luxury goods", "Workshop areas", "Differential burial goods"],
                imageFolder: "neolithic"
            }
        ]
    },
    
    // Chalcolithic/Copper Age (5,500 - 3,000 BCE)
    "chalcolithic": {
        title: "Chalcolithic/Copper Age",
        period: "5,500 - 3,000 BCE",
        description: "The transitional period between the Neolithic and Bronze Age, marked by the first use of metal",
        events: [
            {
                year: "5500 BCE",
                shortDesc: "Early metallurgy",
                title: "Copper Working",
                description: "First evidence of copper smelting in the Balkans and Middle East, marking the beginning of human metalworking",
                details: "The earliest known copper smelting occurred in places like Belovode (Serbia) and Çatalhöyük (Turkey), marking the beginning of human metalworking.",
                keyFigures: [],
                culturalContext: "The ability to work with metal represented a significant technological advancement, eventually leading to more durable tools and weapons and new forms of wealth and status.",
                locations: ["Balkans", "Serbia", "Turkey", "Middle East"],
                artifacts: ["Copper beads", "Simple tools", "Decorative items"],
                imageFolder: "neolithic"
            },
            {
                year: "5000 BCE",
                shortDesc: "Irrigation agriculture",
                title: "Mesopotamia",
                description: "Development of complex irrigation systems in the Tigris-Euphrates valley, enabling intensive agriculture in arid regions",
                details: "Early Mesopotamians developed sophisticated irrigation systems, digging canals to bring water from rivers to fields, allowing for intensive agriculture in an otherwise arid region.",
                keyFigures: [],
                culturalContext: "Control of water resources became central to political power in early Mesopotamia, with irrigation projects requiring coordinated labor and centralized authority.",
                locations: ["Mesopotamia", "Iraq", "Syria"],
                artifacts: ["Canal remains", "Water control devices"],
                imageFolder: "bronze_age"
            },
            {
                year: "4500 BCE",
                shortDesc: "Long-distance trade",
                title: "Trade Networks",
                description: "Extensive trade networks develop across the Near East, exchanging raw materials, finished goods, and ideas",
                details: "By 4500 BCE, archaeological evidence shows extensive trade networks connecting distant regions, exchanging materials like obsidian, lapis lazuli, and copper, as well as finished products.",
                keyFigures: [],
                culturalContext: "These trade networks facilitated not just economic exchange but also the spread of ideas, technologies, and cultural practices across diverse regions.",
                locations: ["Near East", "Mesopotamia", "Anatolia", "Levant"],
                artifacts: ["Imported materials", "Standardized weights", "Seals"],
                imageFolder: "bronze_age"
            },
            {
                year: "4000 BCE",
                shortDesc: "Proto-writing",
                title: "Administrative Tokens",
                description: "Development of clay tokens, seals, and counting devices for record keeping in Mesopotamia",
                details: "The precursors to writing emerged in the form of clay tokens used to record quantities of goods, especially in administrative contexts. These tokens evolved into impressed and later incised symbols on clay tablets.",
                keyFigures: [],
                culturalContext: "These early accounting systems reflect the increasing complexity of economic organization and the need to track exchanges, debts, and ownership in growing urban societies.",
                locations: ["Mesopotamia", "Uruk", "Susa"],
                artifacts: ["Clay tokens", "Bullae", "Cylinder seals"],
                imageFolder: "bronze_age"
            },
            {
                year: "3500 BCE",
                shortDesc: "Wheel invention",
                title: "Mesopotamian Innovation",
                description: "The wheel is invented, first for pottery making (potter's wheel) and later adapted for transportation",
                details: "The wheel was first used for pottery making (potter's wheel) before being adapted for transportation. Early wheels were solid wooden discs attached to axles.",
                keyFigures: [],
                culturalContext: "The wheel revolutionized transportation, trade, and warfare, allowing for the movement of heavier loads over longer distances and contributing to the expansion of early states.",
                locations: ["Mesopotamia", "Eurasia"],
                artifacts: ["Early wheeled vehicles", "Potter's wheels"],
                imageFolder: "bronze_age"
            },
            {
                year: "3300 BCE",
                shortDesc: "First writing system",
                title: "Sumerian Cuneiform",
                description: "Development of cuneiform writing in Sumer, using wedge-shaped marks on clay tablets for record keeping",
                details: "Cuneiform began as pictographs pressed into clay tablets with a reed stylus, primarily for recording economic transactions. It evolved into a more abstract system that could express complex ideas and narratives.",
                keyFigures: ["Sumerian scribes"],
                culturalContext: "Writing allowed for more complex administration, the preservation of knowledge, literature, and religious texts, fundamentally transforming how societies functioned and remembered their past.",
                locations: ["Sumer", "Uruk", "Southern Mesopotamia"],
                artifacts: ["Clay tablets", "Cylinder seals"],
                imageFolder: "bronze_age/hieroglyphics"
            }
        ]
    },

    // Early Urban Civilizations (5,000 - 3,000 BCE)
    "earlyUrban": {
        title: "Early Urban Civilizations",
        period: "5,000 - 3,000 BCE",
        description: "The emergence of the first cities and complex societies",
        events: [
            {
                year: "5000 BCE",
                shortDesc: "Early irrigation systems",
                title: "Mesopotamia",
                description: "Development of irrigation in the Tigris-Euphrates valley",
                details: "Early Mesopotamians developed sophisticated irrigation systems, digging canals to bring water from rivers to fields, allowing for intensive agriculture in an otherwise arid region.",
                keyFigures: [],
                culturalContext: "Control of water resources became central to political power in early Mesopotamia, with irrigation projects requiring coordinated labor and centralized authority.",
                locations: ["Mesopotamia", "Iraq", "Syria"],
                artifacts: ["Canal remains", "Water control devices"],
                imageFolder: "bronze_age"
            },
            {
                year: "3500 BCE",
                shortDesc: "Invention of the wheel",
                title: "Mesopotamian Innovation",
                description: "Wheel technology transforms transportation and pottery production",
                details: "The wheel was first used for pottery making (potter's wheel) before being adapted for transportation. Early wheels were solid wooden discs attached to axles.",
                keyFigures: [],
                culturalContext: "The wheel revolutionized transportation, trade, and warfare, allowing for the movement of heavier loads over longer distances and contributing to the expansion of early states.",
                locations: ["Mesopotamia", "Eurasia"],
                artifacts: ["Early wheeled vehicles", "Potter's wheels"],
                imageFolder: "bronze_age"
            },
            {
                year: "3300 BCE",
                shortDesc: "First writing system",
                title: "Sumerian Cuneiform",
                description: "Development of writing in Sumer (cuneiform) revolutionizes record keeping",
                details: "Cuneiform began as pictographs pressed into clay tablets with a reed stylus, primarily for recording economic transactions. It evolved into a more abstract system that could express complex ideas and narratives.",
                keyFigures: ["Sumerian scribes"],
                culturalContext: "Writing allowed for more complex administration, the preservation of knowledge, literature, and religious texts, fundamentally transforming how societies functioned and remembered their past.",
                locations: ["Sumer", "Uruk", "Southern Mesopotamia"],
                artifacts: ["Clay tablets", "Cylinder seals"],
                imageFolder: "bronze_age/hieroglyphics"
            }
        ]
    },

    // Bronze Age Civilizations (3,000 - 1,200 BCE)
    "bronzeAge": {
        title: "Bronze Age Civilizations",
        period: "3,000 - 1,200 BCE",
        description: "The era of bronze metallurgy and the first empires",
        events: [
            {
                year: "2700 BCE",
                shortDesc: "Egyptian Old Kingdom",
                title: "Pyramid Age",
                description: "Construction of the Great Pyramids of Giza begins",
                details: "The Great Pyramid of Giza, built for Pharaoh Khufu, was the tallest human-made structure in the world for over 3,800 years. The pyramids demonstrate the extraordinary organizational capacity and engineering skills of ancient Egyptians.",
                keyFigures: ["Pharaoh Khufu", "Pharaoh Khafre", "Pharaoh Menkaure", "Imhotep"],
                culturalContext: "The pyramids were part of elaborate funerary complexes designed to ensure the pharaoh's successful journey to the afterlife, reflecting Egyptian religious beliefs about death and immortality.",
                locations: ["Egypt", "Giza", "Nile Valley"],
                artifacts: ["Pyramids", "Funerary objects", "Hieroglyphic inscriptions"],
                imageFolder: "bronze_age/pyramids"
            },
            {
                year: "2500 BCE",
                shortDesc: "Indus Valley Civilization",
                title: "Harappan Culture",
                description: "Advanced urban centers at Mohenjo-daro and Harappa flourish",
                details: "The Indus Valley Civilization featured remarkably well-planned cities with grid layouts, sophisticated drainage systems, standardized weights and measures, and a still-undeciphered writing system.",
                keyFigures: [],
                culturalContext: "Despite its sophistication, much about Harappan society remains mysterious, including its governance structure, religious practices, and the reasons for its eventual decline.",
                locations: ["Pakistan", "India", "Mohenjo-daro", "Harappa"],
                artifacts: ["Seals with script", "Standardized weights", "Terracotta figurines"],
                imageFolder: "bronze_age/artifacts"
            },
            {
                year: "2000 BCE",
                shortDesc: "Minoan Civilization",
                title: "Crete",
                description: "First advanced European civilization develops on Crete",
                details: "The Minoans built elaborate palace complexes, most famously at Knossos, developed a writing system (Linear A), and created sophisticated art and architecture. They were a major maritime trading power in the Mediterranean.",
                keyFigures: ["King Minos (legendary)"],
                culturalContext: "Minoan culture appears to have emphasized female deities, bull imagery, and maritime trade. Their society seems to have been relatively peaceful and prosperous.",
                locations: ["Crete", "Aegean Sea", "Knossos"],
                artifacts: ["Palace of Knossos", "Bull-leaping frescoes", "Linear A tablets"],
                imageFolder: "bronze_age"
            },
            {
                year: "1792 BCE",
                shortDesc: "Code of Hammurabi",
                title: "Early Legal System",
                description: "One of the earliest and most complete legal codes is created in Babylon",
                details: "The Code of Hammurabi was inscribed on a stone stele and contains 282 laws with scaled punishments based on social status. It covered crime, agriculture, business, and family matters.",
                keyFigures: ["King Hammurabi"],
                culturalContext: "The code's famous principle of 'an eye for an eye' established proportional justice, while its detailed provisions reveal much about Babylonian society and values.",
                locations: ["Babylon", "Mesopotamia", "Iraq"],
                artifacts: ["Hammurabi Stele"],
                imageFolder: "bronze_age"
            }
        ]
    },

    // Iron Age & Classical Period (1,200 BCE - 500 CE)
    "classical": {
        title: "Iron Age & Classical Period",
        period: "1,200 BCE - 500 CE",
        description: "The age of iron technology, philosophy, and the great classical civilizations",
        events: [
            {
                year: "1000 BCE",
                shortDesc: "Phoenician city-states",
                title: "Maritime Trade",
                description: "Phoenicians expand Mediterranean trade networks",
                details: "The Phoenicians established a network of colonies and trading posts throughout the Mediterranean, spreading their alphabet (the basis for many modern writing systems) and connecting diverse cultures through commerce.",
                keyFigures: [],
                culturalContext: "As skilled seafarers and merchants, the Phoenicians facilitated cultural exchange between Egypt, Mesopotamia, and the emerging societies of Europe.",
                locations: ["Lebanon", "Mediterranean Basin", "Carthage", "Tyre", "Sidon"],
                artifacts: ["Purple dye", "Glassware", "Ivory carvings"],
                imageFolder: "classical"
            },
            {
                year: "753 BCE",
                shortDesc: "Founding of Rome",
                title: "Roman Beginnings",
                description: "Traditional date for the founding of Rome",
                details: "According to legend, Rome was founded by Romulus, who with his twin brother Remus was raised by a she-wolf. Archaeological evidence shows early settlements on the Palatine Hill dating to this approximate period.",
                keyFigures: ["Romulus (legendary)"],
                culturalContext: "The founding myths of Rome were important to Roman identity and were elaborated over centuries to connect Rome with divine origins and destiny.",
                locations: ["Italy", "Tiber River", "Seven Hills of Rome"],
                artifacts: ["Early Roman pottery", "Architectural remains"],
                imageFolder: "classical"
            },
            {
                year: "500 BCE",
                shortDesc: "Classical Age",
                title: "Golden Age of Greece",
                description: "Advances in philosophy, art, and science in Athens",
                details: "The Classical period in Athens saw the development of democracy under Pericles, the philosophical work of Socrates, Plato, and Aristotle, and architectural marvels like the Parthenon.",
                keyFigures: ["Pericles", "Socrates", "Plato", "Aristotle", "Phidias"],
                culturalContext: "Athenian democracy, though limited to free adult males, represented a revolutionary political system that has influenced governments throughout history.",
                locations: ["Greece", "Athens", "Acropolis"],
                artifacts: ["Parthenon", "Athenian pottery", "Philosophical texts"],
                imageFolder: "classical/parthenon"
            },
            {
                year: "221 BCE",
                shortDesc: "Unification of China",
                title: "Qin Dynasty",
                description: "Qin Shi Huang unifies China and begins the Great Wall",
                details: "Qin Shi Huang conquered the warring states of China, standardized weights, measures, and writing, built road networks, and began construction of the Great Wall to protect against northern invaders.",
                keyFigures: ["Qin Shi Huang", "Li Si"],
                culturalContext: "The Qin Dynasty established the centralized imperial system that would govern China for over two millennia, though the harsh Legalist policies of Qin Shi Huang led to the dynasty's quick collapse after his death.",
                locations: ["China", "Xianyang", "Great Wall"],
                artifacts: ["Terracotta Army", "Standardized coins", "Early Great Wall sections"],
                imageFolder: "classical"
            },
            {
                year: "27 BCE",
                shortDesc: "Roman Empire",
                title: "Augustus",
                description: "Roman Republic transitions to the Roman Empire",
                details: "After defeating Mark Antony and Cleopatra, Octavian became Augustus, the first Roman Emperor, establishing the Pax Romana (Roman Peace), a period of relative stability that lasted about 200 years.",
                keyFigures: ["Augustus (Octavian)", "Julius Caesar", "Mark Antony", "Cleopatra"],
                culturalContext: "Augustus maintained the facade of republican government while centralizing power, creating a model of imperial rule that balanced military power, legal authority, and public approval.",
                locations: ["Rome", "Italy", "Mediterranean Basin"],
                artifacts: ["Augustan architecture", "Imperial portraits", "Coinage"],
                imageFolder: "classical/colosseum"
            },
            {
                year: "476 CE",
                shortDesc: "Fall of Rome",
                title: "End of Western Roman Empire",
                description: "Romulus Augustulus is deposed, marking the fall of the Western Roman Empire",
                details: "The Germanic commander Odoacer deposed the last Western Roman Emperor, Romulus Augustulus, sending the imperial regalia to the Eastern Emperor Zeno and ruling Italy as a king rather than an emperor.",
                keyFigures: ["Romulus Augustulus", "Odoacer", "Emperor Zeno"],
                culturalContext: "While traditionally seen as the 'fall' of Rome, this event was part of a gradual transformation rather than a sudden collapse, with many Roman institutions continuing under Germanic rule.",
                locations: ["Italy", "Ravenna", "Rome"],
                artifacts: ["Late Roman military equipment", "Germanic artifacts"],
                imageFolder: "classical"
            }
        ]
    }
};

// Export the data for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { timelineData };
} else {
    // For browser environment
    window.timelineData = timelineData;
}