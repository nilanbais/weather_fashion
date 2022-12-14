# Software Requirements Specification
Dit document bevat de software requirements van de op te leveren web applicatie.

## Doel
We twijfelen allemaal wel eens over of we onszelf warm genoeg hebben aangekleed óf dat dat wat we aan hebben getrokken juist niet te warm is. In beide scenario's helemaal kut. Wat je kan doen om wat twijfel bij jezelf weg te nemen, is naar buiten kijken en kijken wat andere mensen die dag hebben aangetrokken. Dus stel, je doet dat, kijkt naar buiten en ziet vervolgens een gozer in een korte broek en kort daarna iemand met een winterjas; als nog niet wijzer geworden.

Het doel van de te ontwikkelen software is het bieden van een oplossing voor het probleem van te warm óf te koud aangekleed te zijn. Deze oplossing wordt daarbij aangeboden in de vorm van een dagelijks gepersonaliseerd advies voor de outfit die naar wens is; niet te warm, niet te koud.

Het gaat hier echter niet om de style van de outfit en of de schoenen wel bij de jas passen. Het gaat hier om het zorgen dat mensen niet de hele dag lopen te klappertanden van de kou of zich te pleuris lopen te zweten omdat ze teveel aan hebben.

## Doelgroep
De doelgroep voor deze software is iedereen, of een ieder die advies nodig heeft m.b.t hun outfit in de transitiemaanden tussen de seizoenen. 

## Soortgelijke projecten
[Warmetruiendag app](https://appadvice.com/app/warmetruiendag-clo/1205192774) is een app die hetzelfde doel vervult als Weeather Fashion. Echter is deze app niet meer beschikbaar voor gebruik. Dit geeft ons genoeg motivatie om alsnog door te gaan met de ontwikkeling van Weather Fashion. Daarbij kan de link worden gebruikt om inspiratie op te doen over gebruik en vormgeving van de app.

## Gebruik
De software wordt eerste instantie aangeboden als web applicatie (webapp). Wanneer iemand het advies nodig heeft, navigeren ze het systeem naar keuze naar de webapp en lezen het advies dat ze wordt aangeboden.

Daarbij komt de mogelijkheid van het geven van feedback op het genoten advies. Die wordt gedaan met de volgende opties:
- was lijp warm.
- was piecie warm.
- niets te klagen neef.
- was piecie koud.
- was koud koud.

## Scope
De webapp geeft in eerste instantie een drievoud aan adviezen, namelijk voor mensen die:
- het snel koud hebben;
- het snel warm hebben;
- het niet opmerkelijk snel warm of koud hebben.

Daarbij moet het ook mogelijk zijn om over de tijd een gepersonaliseerd advies te geven. Hoe dit exact gerealiseerd kan worden, moet nog onderzocht worden. De mogelijkheden hierin zijn waarschijnlijk cache geheugen of de mogelijkheid om te registreren. 

Als cache geheugen ingezet kan worden om dit te bereiken, dan heeft dat de voorkeur echter moet nog onderzocht worden of het mogelijk is.

## Definities

|Begrip|Definitie/Toelichting|
|------|---------------------|
|Kou Score (KS)|De waarde die wordt bijgehouden om een gepersonaliseerd advies te geven. Een negatieve score indiceert dat iemand het snelappler koud heeft dan normaal en een positieve score geeft dat iemand het warmer heeft dan normaal.


## Aannames en afhankelijkheden
De webapp wordt gebouwd met de MERN stack en de n-tier architecture pattern.

Er wordt uitgegaan van de mogelijkheid cashe te gebruiken voor het gepersonaliseerde advies.

Ook wordt ervan uit gegaan dat er een gemakkelijke manier is voor het dagelijk ophalen van de weersverwachtingen en het wegzetten van deze info in de database.

## User story
Hier wordt de user story voor de webapp omschreven. Hierin wordt onderscheid gemaakt tussen de user stories van een eindgebruiker die de app voor een eerste keer gebruikt en een terugkerende eindgebruiker.

### User story; De nieuwe eindgebruiker
Om de app te gebruiken, navigeert de user in zijn/haar browser naar de desbetreffende URL waar de app beschikbaar is.

Bij "binnenkomst" wordt de homepage gepresenteerd. Deze homepage is gelijkertijd ook eigenlijk de enige pagina die de eindgebruikers nodig hebben. Op deze homepage staan de volgende zaken gepresenteerd óf is het direct duidelijk dat en waar zij deze informatie ter beschikking hebben:
-   een titel
-   de datum/tijd
-   uitleg van het gebruik van de app
-   de weersverwachting (met mogelijkheid een locatie te selecteren/specificeren/te bepalen o.b.v. locatie van hun systeem)
-   een manier om een Kou Score KS te selecteren/specificeren (standaard en custom waarden)
-   een advies op basis van de geselecteerde KS
-   een UI (user interface) om zich te kunnen registreren

### User story; de geregistreerde eindgebruiker
De toegang tot de app blijft voor alle gebruikers gelijk.

Ten opzichte van de nieuwe gebruiker ziet de geregistreerde gebruiker hetzelfde, met de volgende aspecten/feature toegevoegd:
-   de naam van de gebruiker
-   de mogelijkheid om instellingen aan te passen
-   kunnen selecteren van gepersonaliseerd KS (GKS)
-   veld om feedback te kunnen geven op de GKS

Deze extra feature is m.b.t. het selecteren/specificeren van de KS. Wanneer een gebruiker geregistreerd is, wordt de extra optie om een gepresonaliseerde KS (GKS) te gebruiken beschikbaar gemaakt voor de eindgebruiker. Daarbij komt een de mogelijkheid om feedback te geven over de GKS. Wanneer feedback is gegeven, wordt de GKS aangepast in de database.

#### Geregistreerde gebruiker op een nieuw systeem
Wanneer een geregistreerde gebruiker gebruik wilt maken van zijn/haar GKS op een ander/nieuw systeem, moeten ze enkel inloggen met de gegevens waarmee ze geregistreerd zijn. Op basis van deze gegevens wordt de benodigde data en de GKS opgehaald, zodat de eindgebruiker hier gebruik van kan maken. Ook worden de extra velden voor de geregistreerde gebruikers beschikbaar gemaakt in de app.

### User story; de terugkerende eindgebruiker
De toegang tot de app blijft voor alle gebruikers gelijk.

Bij terugkeer in de app wordt er qua velden hetzelfde gepresenteerd als altijd, met de instellingen als hoe ze het achtergelaten hebben.

## Requirements

### Functional Requirements
Hier volgt een lijst met benodigdheden:
-   een database gevuld met advies per temperatuurscategorie (afronden volgens: 4.5 t/m 5.4 => 5) (voor nu doen voor T>=5 tot T<=20)
-   een connectie met een weersbericht api waarbij minimaal temperatuur en windkracht op te vragen zijn
-   een frontend framework met de volgende aspecten:
    -   een titel
    -   een uitleg van gebruik van de webapp
    -   optie om één van 5 standaard KS waarden in te stellen voor direct gebruik
    -   optie om KS waarde in te stellen via slider
    -   plek waar weersverwachting wordt gepresenteerd
    -   plek waar het advies wordt gepresenteerd
    -   mogelijkheid om te registreren/inloggen (wss mogelijkheid om door te klikken naar window voor dit)
    -   bij inloggen, de mogelijkheid om aan te geven of ze ingelogd willen blijven
-   gebruik kunnen maken van cookies
-   mogelijkheid voor het geven van feedback wanneer KS van de gebruiker in de database staat

### User Interfaces
-   front-end software: React Navtive
-   backend software: Express.js
-   Database software: MongoDB
-   netwerkprotocol: HTTPS (?)

### Hardware Interface
Web app moet beschikbaar zijn vanuit alle browsers vanaf de volgende systemen:
-   PC systeem (MacOS, Linux, Windows)
-   IOS systemem
-   Android systemen

### Performance requirements
-   De webapp moet binnen 3 seconde volledig bruikbaar zijn (uitgaande van een goede internetverbinding)
-   Aanpassingen aan variabelen moeten direct gereflecteerd worden in de velden waar deze invloed op hebben
-   Bij terugkeer moeten de variabelen waar de eindgebruiker invloed op heeft, hetzelfde zijn als hoe ze deze hebben achtergelaten.
-   Bij terugkeer moeten de variabelen waar de eindgebruiker geen invloed op heeft, geüpdatet zijn.

### Safety requirements
-   De GKS in de database moeten redundant opgeslagen worden op een andere locatie, zodat deze data niet verloren gaat.
-   Elke dag of week moet een backup gemaakt worden van de database. Backups worden voor een week bewaard.

### Security requirememts
-   De database mag geen volledige gepersonaliseerde gegevens bevatten, los van de GKS en de gekozen naam die wordt gebruikt als groet.
-   Keys voor het authenitseren van de RestAPI call, moeten veilig en encrypted worden opgeslagen.
-   Alleen de laag met de Application logica mag connectie maken met de Data Access laag
-   De implementatie van de database moet zo afgeschermd mogelijk zijn. De database moet alleen gebruikt kunnen worden voor dat waar het voor gebruikt moet worden. Geen open eindpunten.

### Quality requirements
-   Beschikbaarheid: De beschikbaarheid van de app moet zo hoog mogelijk zijn, maar 100% is daarin geen realistisch doel. Dit blijft vooral een project om te leren, waardoor dat nu de focus heeft.
-   Correctheid: De app mag nooit gegevens presenteren aan een eindgebruiker waar dit niet voor bestemd is.
-   Onderhoudbaarheid: De app moet gebruik magen van een geautomatiseerd integratie (niet per se continuous integration) die de app test op haar cruciale aspecten.
-   Bruikbaarheid: De app moet met minimale uitleg over te interfaces gelijk te gebruiken zijn.
-   Test dekking: Om toch enige gerantie te kunnen geven m.b.t. de beschikbaarheid van de app, moet de dekking van de test minimaal 80% bedragen. Fomule voor het bepalen van de test dekking:

    ```
    Test Dekking = aantal geautomatiseerde tests / aantal tests dat uitgevoerd (moet) worden
    ```