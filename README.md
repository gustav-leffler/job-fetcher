# Kom igång
1. Installera Node.js & NPM (https://nodejs.org/en/download/)
2. Installera Git for Windows (https://gitforwindows.org/)
3. Öppna denna mapp i terminalen.
4. Kör kommandot: npm install

5. test

# Kör scraper
Du startar programmet genom att öppna filen "run.bat"

Programmet skapar en ny fil när det är klart som innehåller de jobb den kunde hitta (jobs.xml).
Filen publiceras även automatiskt på: https://gustav-leffler.github.io/job-fetcher/jobs.xml

# Lägg till söklänk
1. Öppna LinkedIn i en Inkognitoflik (så du inte är inloggad)
2. Tryck på Jobb och specificera din sökning (välj plats och företag etc.)
3. När sökningen är gjort kopiera länken från webbläsaren. 
3. Öppna filen "search_links.txt"
4. Klistra in söklänken på en ny rad (det får bara ligga en länk per rad) och spara.

# Ta bort söklänk
1. Öppna filen "search_links.txt"
2. Ta bort länken från filen ooch spara

# Ändra sökfilter
1. Öppna filen index.js
2. Gå till rad 7 som bör se ut ungefär såhär: const CONTENT_FILTER = "#gatewayumea2024";
3. Ändra det som innanför citationstecknen till vad du vill att jobbannonsernas brödtext ska innehålla. Till exempel ändra "#gatewayumea2024" till "#gatewayumea2025".
