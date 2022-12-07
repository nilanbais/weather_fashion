# Software Requirements Specification
Dit document bevat de software requirements van de op te leveren web applicatie.


## Doel
We twijfelen allemaal wel eens over of we onszelf warm genoeg hebben aangekleed óf dat dat wat we aan hebben getrokken juist niet te warm is. In beide scenario's helemaal kut. Wat je kan doen om wat twijfel bij jezelf weg te nemen, is naar buiten kijken en kijken wat andere mensen die dag hebben aangetrokken. Dus stel, je doet dat, kijkt naar buiten en ziet vervolgens een gozer in een korte broek en kort daarna iemand met een winterjas; als nog niet wijzer geworden.

Het doel van de te ontwikkelen software is het bieden van een oplossing voor het probleem van te warm óf te koud aangekleed te zijn. Deze oplossing wordt daarbij aangeboden in de vorm van een dagelijks gepersonaliseerd advies voor de outfit die naar wens is; niet te warm, niet te koud.

Het gaat hier echter niet om de style van de outfit en of de schoenen wel bij de jas passen. Het gaat hier om het zorgen dat mensen niet de hele dag lopen te klappertanden van de kou of zich te pleuris lopen te zweten omdat ze teveel aan hebben.

## Doelgroep
De doelgroep voor deze software is iedereen, of een ieder die advies nodig heeft m.b.t hun outfit in de transitiemaanden tussen de seizoenen. 

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
|Koude Score (KS)|De waarde die wordt bijgehouden om een gepersonaliseerd advies te geven. Een negatieve score indiceert dat iemand het sneller koud heeft dan normaal en een positieve score geeft dat iemand het warmer heeft dan normaal.


## Benodigdheden voor eindgebruiker
Een browser.

## Aannames en afhankelijkheden
Er wordt uitgegaan van de mogelijkheid cashe te gebruiken voor het gepersonaliseerde advies.

Ook wordt ervan uit gegaan dat er een gemakkelijke manier is voor het dagelijk ophalen van de weersverwachtingen en het wegzetten van deze info in de database. 

## Features en Requirements

### Functional Requirements

### Externe Interface Requirements

### Systeem Features

### Non-functional Requirements