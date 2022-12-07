# weather_fashion

## Funtioneel ontwerp
Dit stuk doelt op een uiteenzetting van de wensen/ideeën die wij hebben bij het eindproduct. Binnen deze wensen/ideeën wordt er onderschijt gemaakt tussen een uiteindelijke uitbreiding en een aspect wat écht in de eerste versie van het product moet zitten. Wanneer het niet in het eerste product wordt opgenomen, wordt dit aangegeven door het vermelden van `(ooit)` bij het desbetreffende punt.


Het eindproduct moet het volgende probleem oplossen:
```
Je stapt je bed uit en kleed je aan. Alles verloopt lekker die ochtend, tot je je opeens beseft dat je je te koud of te warm hebt aangekleed.
```

Weather_Fashion is daar om je elke ochtend een (persoonlijk) advies te geven over wat je het best aan kunt trekken voor de verwachtte weersomstandigheden. Dit kan in de vorm van een widget, een app, een notificatie, op de manier naar keuze (ooit, focus eerst op 1 manier).

Om ons advies persoonlijk en bruikbaar te maken, moet men voor het gebruik van weather_fashion éénmalig registeren. Tijdens het gebruik van weather_fashion vragen wij aan het eind van de dag een snelle terugkoppeling m.b.t. het advies dat wij hebben geformuleerd, volgens de opties:
```
Het advies was:
- te warm
- goed
- te koud
```
(ooit) Het is ook mogelijk om de opzet van het advies aan te passen. Ook geven we u de vrijheid om een voorkeurstijd in te stellen voor het ontvangen van het advies. Daarbij bestaat er ook een optie dat u de app een wekker laat detecteren en het adviesmoment laat afhangen van de wekker die door u is ingesteld.

Variabelen die benodigd zijn om een fashionadvies te realiseren.
-Temperatuur
-Windkracht
-Luchtvochtigheid
-Koudescore user

Met deze variabelen kan de gevoelstemperatuur berekend worden. Hiervan zijn al meerdere formules van. Hier een voorbeeld:
De formule voor de gevoelstemperatuur (G) op basis van JAG/TI-methode luidt: **G= 13.12 + 0.6215T - 13,96W (macht 0,16) + 0.4867TW (macht0,16)**

met temperatuur T in °C op 1,50 meter hoogte en gemiddelde windsnelheid W in de afgelopen tien minuten in m/s op 10 meter hoogte (conform de internationale afspraken voor de meting van luchttemperatuur en windsnelheid). De windsnelheid wordt met de machtsfunctie (^0,16) herleid van de windmeting op 10 meter hoogte naar de wind op 1,50 meter hoogte. In de formule moet de koudescore verwerkt zien te worden. Vannuit daaruit kan een advies worden uitgedragen.

Ook zal er rekening(toekomst) gehouden moeten worden met hoe lang de persoon van plan is buiten zijn casa te verblijven.

#### Alternatief
Een alternatieve manier van distribueren kan als volgt zijn.
De gebruiker komt op de webapp en logt in. Op het inlogscherm van de gebruiker kan hij/zij een widget importeren die op de telefoon wordt geïnstalleerd. De reden is dat er in de source van de widget ergens de user_id moet terugkomen, zodat deze gebruikt kan worden in het ophalen van het advies en het updaten van het gepersonaliseerde advies.


## Software Architectuur
De architectuur van de webapp volgt de prioncipes van het MVC (Model-View-Controller) patroon en het N-Tier patroon. Beide introduceren een opsplitsing van verschillende hoofdgroepen binnen de software; het frontend framework, de backend server, en de logica die zorgt voor een koppeling tussen front- en backend.

De software is in deze software opgedeeld in de volgende lagen:
- Data Access, bestaande uit
    - Database logic/implementation
    - Data Service
- Application Logic
- User Interface (UI)

### Data Access laag
De laag van de Data Access is eigenlijk een samenstelling van twee lagen; de laag met de database logica en de Data Service laag. 
Deze opdeling is geïntroduceert zodat de implementatie van de database en de handelingen/interacties die gedaan moeten worden met de database (data service laag), worden opgesplitst. Er wordt ingeschat/verwacht dat dit de onderhoudbaarheid en adaptiviteit van de data access laag moet vergroten.

### Application Logic laag
De Application Logic laag is te zien als een equivalent van de Controller uit het MVC patroon of een API (Application Programmable Interface). De hoofdfocus van deze laag is het "vertalen" van clicks, verkregen van de UI, naar acties (requests) voor het ophalen/wegschrijven/aanpassen van data in de data access laag.

### User Interface laag
De User Interface laag is de laag die wordt gepresenteerd aan de eindgebruiker. Dit is de laag waar clicks en andere vormen van interactie worden geïnterpreteerd en eenmaal geinitieerd, worden gekoppeld aan functionaliteit van de Application Logic laag.

## Software Stack
De software Stack die wordt toegepast in dit project is de MERN stack, met een deployment op Heroku. 

Mits niet mogelijk in de eerder benoemde stack, wordt er nog een techniek toegepast voor het triggeren van een workflow voor het dagelijks genereren van een advies. De kans is groot dat dit wordt gerealiseerd a.h.v. github actions. Hoe dit uiteindelijk vorm gaat krijgen, wordt in een later stadium opnieuw grondig bekeken.
