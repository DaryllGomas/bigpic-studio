/**
 * "Did You Know?" Feature
 * Adds interesting facts about historical events and periods
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create a database of interesting facts
    const didYouKnowFacts = {
        // Prehistoric
        "prehistoric": [
            "The oldest human footprints discovered in Europe are approximately 850,000 years old, found at Happisburgh in Norfolk, UK.",
            "The Lascaux cave paintings in France were discovered by four teenagers who were following their dog when it fell into a hole leading to the cave.",
            "The earliest known musical instruments are flutes made from bird bone and mammoth ivory, dating back 42,000 to 43,000 years ago.",
            "Modern humans (Homo sapiens) and Neanderthals coexisted for about 5,000 years and evidence suggests they interbred."
        ],
        // Pre-Cataclysm (Theoretical)
        "preCataclysm": [
            "The Sphinx in Egypt shows evidence of water erosion that some geologists argue could only have occurred much earlier than its conventional dating, possibly during the rainy period at the end of the last ice age.",
            "Similar architectural techniques for fitting massive stone blocks together with incredible precision can be found in ancient sites across the world, from Peru to Egypt, despite no known contact between these civilizations.",
            "Many ancient sites around the world are aligned with astronomical events and constellations, suggesting sophisticated knowledge of astronomy that was supposedly beyond the capabilities of ancient peoples.",
            "Over 200 ancient flood myths from different cultures around the world share striking similarities, potentially suggesting a common origin from a real catastrophic event."
        ],
        // Cataclysm (Theoretical)
        "cataclysm": [
            "A thin black layer of soil called the 'black mat' can be found throughout North America dating to 12,900 BCE, containing unusual materials including nanodiamonds, which some scientists believe were created by a cosmic impact.",
            "The rapid extinction of over 35 genera of large mammals in North America coincided precisely with the beginning of the Younger Dryas cooling period.",
            "Ice core samples from Greenland show that temperatures dropped by approximately 15°C (27°F) within a single decade at the start of the Younger Dryas period.",
            "Extensive evidence of massive flooding exists throughout Washington state in the 'Channeled Scablands', created when ice dams holding glacial Lake Missoula repeatedly failed around 13,000-15,000 years ago."
        ],
        // Recovery (Theoretical)
        "recovery": [
            "The end of the Younger Dryas period around 11,700 BCE saw temperatures rise by as much as 10°C within just a decade, according to Greenland ice cores.",
            "The 12,000-year-old temple complex at Göbekli Tepe in Turkey was intentionally buried around 10,000 BCE, preserving it until its discovery in 1994.",
            "Many indigenous cultures preserved knowledge through oral traditions that were later dismissed as 'myths' but have sometimes been verified by modern archaeology.",
            "Ancient measuring systems from different cultures often share mathematical relationships that suggest they may have derived from a common, earlier system of measurement."
        ],
        // Pre-Pottery Neolithic
        "prePotteryNeolithic": [
            "At Göbekli Tepe, the massive T-shaped pillars, weighing up to 20 tons, were carved and moved without the use of metal tools or even pottery, as neither had been invented yet.",
            "The ancient city of Jericho has been continuously inhabited for over 11,000 years, making it one of the oldest continuously inhabited settlements in the world.",
            "Evidence suggests that dogs were the first animals domesticated by humans, possibly as early as 30,000 years ago, long before other animals or plants.",
            "Early farmers in the Fertile Crescent selected wheat plants with non-shattering seed heads, an evolutionary disadvantage in the wild but perfect for human harvesting."
        ],
        // Pottery Neolithic
        "potteryNeolithic": [
            "At Çatalhöyük, residents buried their dead beneath the floors of their houses, sometimes repeatedly excavating and reburying the remains.",
            "The earliest pottery wasn't used for cooking, but for storage of grain and other valuables.",
            "The spread of agriculture into Europe followed two main routes: the Mediterranean coast and the Danube River valley.",
            "Early Neolithic farmers were significantly shorter and experienced more dental problems than their hunter-gatherer counterparts, suggesting agriculture initially led to a decline in health."
        ],
        // Chalcolithic
        "chalcolithic": [
            "The Iceman 'Ötzi', who lived around 3300 BCE, had 61 tattoos made by rubbing charcoal into small cuts in the skin, possibly for therapeutic purposes.",
            "The oldest known wheel used for transportation was found in Slovenia and dates to around 3200 BCE.",
            "Early copper smelting reached temperatures of over 1,000°C (1,832°F), requiring sophisticated furnace technology and understanding of air flow.",
            "The earliest known system of writing (proto-cuneiform) was not created to record stories or ideas, but to keep track of economic transactions and property."
        ],
        // Bronze Age
        "bronzeAge": [
            "The Great Pyramid of Giza is so precisely aligned to true north that it's off by only 3/60th of a degree, a level of accuracy that would challenge modern builders even with advanced technology.",
            "Ancient Egyptians were using toothpaste made from ox hooves, ashes, burnt eggshells, and pumice as early as 5000 BCE.",
            "Some of the stone blocks in the Great Pyramid weigh up to 80 tons and were transported from quarries more than 500 miles away.",
            "The Bronze Age collapse around 1200 BCE saw virtually all major cities in the eastern Mediterranean destroyed within a 50-year period, for reasons still debated."
        ],
        // Classical Period
        "classical": [
            "Ancient Rome had apartment buildings called 'insulae' that could be up to 9 stories high and house over 200 people.",
            "The ancient Greeks had a working steam engine called the aeolipile, invented by Hero of Alexandria around 60 CE, but it was used only as a toy and demonstration device.",
            "The Great Wall of China used a mortar made with sticky rice that made it extraordinarily strong and durable.",
            "The Antikythera Mechanism, discovered in a shipwreck from around 60 BCE, is an ancient Greek analog computer used to predict astronomical positions and eclipses decades in advance."
        ],
        // Post-Classical
        "postClassical": [
            "During the Islamic Golden Age (8th to 14th centuries), the city of Cordoba in Spain had 70 libraries, with the central library containing over 400,000 books, at a time when the largest library in Christian Europe had only a few hundred manuscripts.",
            "The Aztec capital Tenochtitlan had a population of around 200,000 people in the early 16th century, making it one of the largest cities in the world at that time, larger than any European city except Constantinople.",
            "Viking navigational techniques included the use of 'sunstones' (crystals of Icelandic spar) that could determine the position of the sun on cloudy days by polarizing the light.",
            "The Angkor Wat temple complex in Cambodia is the largest religious monument in the world, covering an area of approximately 400 acres."
        ],
        // Early Modern
        "earlyModern": [
            "Christopher Columbus never actually set foot on the mainland of North America, only landing on Caribbean islands and parts of Central and South America.",
            "The first newspaper published in North America, 'Publick Occurrences Both Forreign and Domestick', was shut down after just one issue in 1690 because it published without authority.",
            "Isaac Newton spent more time studying alchemy and biblical chronology than he did on mathematics and physics.",
            "The Salem Witch Trials in 1692-93 led to the execution of 20 people, but none of them were actually burned at the stake—19 were hanged and one was pressed to death with heavy stones."
        ],
        // Modern Era
        "modern": [
            "The first computer programmer was Ada Lovelace, who wrote an algorithm for Charles Babbage's Analytical Engine in the 1840s, over a century before modern computers were built.",
            "The 1918 influenza pandemic infected about 500 million people, or one-third of the world's population at the time, and killed between 20-50 million people.",
            "The shortest war in recorded history was the Anglo-Zanzibar War of 1896, which lasted just 38 minutes from declaration to surrender.",
            "During World War II, the Oscar statuettes were made of painted plaster instead of gold-plated bronze due to metal shortages. Winners later received the proper statues after the war ended."
        ]
    };
    
    // Create "Did You Know" module for each timeline section
    const timelineSections = document.querySelectorAll('.timeline-section');
    
    timelineSections.forEach(section => {
        // Get period title to determine which facts to use
        const periodTitle = section.querySelector('.period-title').textContent;
        const periodId = getPeriodIdFromTitle(periodTitle);
        
        // If we have facts for this period
        if (periodId && didYouKnowFacts[periodId]) {
            // Create "Did You Know" container
            const dykContainer = document.createElement('div');
            dykContainer.className = 'did-you-know-container';
            
            // Get random fact for this period
            const facts = didYouKnowFacts[periodId];
            const randomFact = facts[Math.floor(Math.random() * facts.length)];
            
            // Create content
            dykContainer.innerHTML = `
                <h3 class="dyk-title">DID YOU KNOW?</h3>
                <div class="dyk-content">${randomFact}</div>
                <div class="dyk-refresh">↻</div>
            `;
            
            // Add refresh functionality
            const refreshButton = dykContainer.querySelector('.dyk-refresh');
            refreshButton.addEventListener('click', function() {
                // Get new random fact (different from current one)
                let newFact = randomFact;
                while (newFact === randomFact && facts.length > 1) {
                    newFact = facts[Math.floor(Math.random() * facts.length)];
                }
                
                // Update content
                dykContainer.querySelector('.dyk-content').textContent = newFact;
            });
            
            // Insert after period title
            section.appendChild(dykContainer);
        }
    });
    
    // Helper function to get period ID from title text
    function getPeriodIdFromTitle(title) {
        const periodMap = {
            'PREHISTORIC PERIOD': 'prehistoric',
            'PRE-CATACLYSM ADVANCED CIVILIZATION': 'preCataclysm',
            'THE GREAT CATACLYSM': 'cataclysm',
            'RECOVERY & KNOWLEDGE PRESERVATION': 'recovery',
            'PRE-POTTERY NEOLITHIC': 'prePotteryNeolithic',
            'POTTERY NEOLITHIC': 'potteryNeolithic',
            'CHALCOLITHIC/COPPER AGE': 'chalcolithic',
            'BRONZE AGE CIVILIZATIONS': 'bronzeAge',
            'IRON AGE & CLASSICAL PERIOD': 'classical',
            'POST-CLASSICAL PERIOD': 'postClassical',
            'EARLY MODERN PERIOD': 'earlyModern',
            'MODERN ERA': 'modern'
        };
        
        // Extract the period name from the full title (remove dates)
        const periodName = title.split('(')[0].trim();
        
        return periodMap[periodName] || null;
    }
});
