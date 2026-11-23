# React-app deployen op een Raspberry Pi 4

Stappenplan: van `localhost` op je laptop, naar de Pi in je thuisnetwerk, naar bereikbaar via internet.

Deze handleiding gaat uit van:

- een **Windows-laptop**, met **WSL** voor Ansible
- een Pi 4 met **Raspbian GNU/Linux 10 (Buster)**, headless, met wifi en SSH al ingesteld

> **Let op: Buster is verouderd.** Het krijgt geen beveiligingsupdates meer, en Docker en andere tools ondersteunen het officieel niet meer. Daarom bouw je de React-app in deze handleiding op je laptop, en draait de Pi alleen een kleine webserver-container. Op de Pi hoeft dus niets zwaars te gebeuren. Loop je toch vast, dan is opnieuw flashen met Raspberry Pi OS Lite (64-bit) de structurele oplossing.

**Stack**

| Onderdeel | Rol | Waar |
|---|---|---|
| React (Vite) | De app | laptop |
| Docker (multi-stage build) | Bouwt de app, en draait lokaal de testcontainer | laptop |
| Caddy | Webserver, met fallback voor client-side routing | container op de Pi |
| Docker Compose | Start de containers | laptop en Pi |
| Ansible | Bouwt, kopieert naar de Pi en (her)start met één commando | WSL op de laptop |
| Cloudflare Tunnel | Maakt de app publiek bereikbaar zonder port forwarding | service op de Pi |

**Waar voer je wat uit?**

- **PowerShell / VS Code-terminal (Windows):** `npm`- en `docker`-commando's om lokaal te ontwikkelen en te testen.
- **WSL:** SSH-sleutel, Ansible en deployen. Ansible logt zelf via SSH in op de Pi.
- **Op de Pi (PuTTY of `ssh`):** alleen de eenmalige voorbereiding in 0.2 en af en toe een controle.

---

## 0. Voorbereiding

### 0.1 Op je laptop

- **Node.js 20+** en **npm** (in Windows)
- **Docker Desktop**, met in **Settings → Resources → WSL integration** je WSL-distributie aangezet. Dan werkt `docker` ook in WSL.
- **WSL** met Ubuntu: `wsl --install` in PowerShell (als administrator), daarna opnieuw opstarten.
- In WSL: Ansible, rsync en de Ansible-collectie voor rsync:

  ```bash
  sudo apt update && sudo apt install -y pipx rsync
  pipx ensurepath            # daarna terminal opnieuw openen
  pipx install "ansible-core<2.18"
  ansible-galaxy collection install ansible.posix
  ```

  Waarom `<2.18`? Buster heeft Python 3.7, en vanaf ansible-core 2.18 is Python 3.8 of hoger nodig op de Pi.

> **Tip:** je Windows-schijf staat in WSL onder `/mnt/c/`. Je project staat dus bijvoorbeeld in `/mnt/c/Users/<naam>/Code/mijn-app`.

### 0.2 De Raspberry Pi (eenmalig, via PuTTY of `ssh`)

Log in op de Pi en loop deze stappen door.

1. **Controleer het systeem:**

   ```bash
   cat /etc/os-release           # moet "Raspbian GNU/Linux 10 (buster)" tonen
   dpkg --print-architecture     # armhf = 32-bit, arm64 = 64-bit
   ```

   Beide architecturen werken met deze handleiding. Onthoud welke je hebt.

2. **Pakketlijsten bijwerken:**

   ```bash
   sudo apt update
   ```

   Krijg je `404 Not Found`-fouten? Dan zijn de Buster-pakketbronnen naar een archief verhuisd. Pas in dat geval `/etc/apt/sources.list` aan en verwijs naar het archief (voor Raspbian is dat `http://legacy.raspbian.org/raspbian/`). Controleer de actuele URL op de Raspberry Pi-forums, want die is in het verleden vaker veranderd.

3. **Docker installeren.** Dat doe je hier met de hand, zodat je de uitvoer kunt zien:

   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

   Het script geeft waarschijnlijk een waarschuwing dat Buster niet meer ondersteund wordt, en wacht dan even. Laat het doorlopen. Daarna:

   ```bash
   sudo usermod -aG docker $USER
   exit                           # opnieuw inloggen, zodat de groep actief wordt
   ```

   Log opnieuw in en test:

   ```bash
   docker run --rm hello-world
   docker compose version
   ```

   Werken beide commando's? Dan is Docker klaar. Faalt de installatie of bestaat `docker compose` niet, dan is opnieuw flashen met Raspberry Pi OS Lite (64-bit) de enige betrouwbare oplossing.

4. **Zoek het IP-adres van de Pi op:**

   ```bash
   hostname -I
   ```

   Geef de Pi in je router een **DHCP-reservering**, zodat dit adres niet verandert. In de rest van de handleiding staat `192.168.1.50`. Vervang dat door jouw adres.

### 0.3 SSH-sleutel van WSL naar de Pi (eenmalig, in WSL)

Ansible gebruikt de SSH-sleutel van WSL, niet die van PuTTY (`.ppk`-bestanden werken niet).

```bash
ssh-keygen -t ed25519                 # alleen als je nog geen sleutel hebt; Enter bij alle vragen
ssh-copy-id pi@192.168.1.50
ssh pi@192.168.1.50                   # moet nu werken zonder wachtwoord
```

Gebruik `pi` of de gebruikersnaam waarmee je in PuTTY inlogt. `raspberrypi.local` werkt vanuit WSL vaak niet, dus gebruik het IP-adres.

---

## 1. Projectstructuur

```
mijn-app/
├── src/                        # React-code (Vite)
├── public/
├── index.html
├── package.json
├── package-lock.json
├── Dockerfile
├── .dockerignore
├── Caddyfile
├── docker-compose.yml          # voor op je laptop
└── ansible/
    ├── inventory.ini
    ├── deploy.yml
    ├── secrets.yml             # tunneltoken, niet committen
    └── files/
        └── docker-compose.pi.yml
```

Heb je nog geen React-app? Maak er dan een aan (in PowerShell):

```bash
npm create vite@latest mijn-app -- --template react
cd mijn-app
npm install
```

Zet dit in `.gitignore`:

```
node_modules
dist
.env
ansible/secrets.yml
```

---

## 2. De app containeriseren

### `Dockerfile`

Een multi-stage build met drie stages:

- `build` bouwt de React-app met Node.
- `dist` bevat alleen het resultaat. Die gebruik je om de gebouwde bestanden naar je laptop te exporteren voor de Pi.
- De laatste stage serveert het resultaat met Caddy. Die gebruik je lokaal om te testen.

```dockerfile
# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Alleen de gebouwde bestanden (voor export naar de Pi) ---
FROM scratch AS dist
COPY --from=build /app/dist /

# --- Runtime stage (lokaal testen) ---
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
```

### `.dockerignore`

```
node_modules
dist
.git
ansible
.env
```

### `Caddyfile`

```caddy
:80 {
    root * /srv
    encode zstd gzip

    # Gehashte assets van Vite mogen lang gecachet worden
    @assets path /assets/*
    header @assets Cache-Control "public, max-age=31536000, immutable"

    # SPA-fallback: onbekende paden naar index.html (nodig voor React Router)
    try_files {path} /index.html
    file_server
}
```

### `docker-compose.yml` (laptop)

```yaml
services:
  web:
    build: .
    ports:
      - "${WEB_PORT:-8080}:80"
    restart: unless-stopped
```

> **Let op bij omgevingsvariabelen in React:** variabelen als `VITE_API_URL` worden tijdens `npm run build` in de JavaScript gebakken. Ze zijn dus build-time, niet runtime. `.env` wordt niet meegenomen in de Docker-build (zie `.dockerignore`). Zet niet-geheime `VITE_`-variabelen daarom in `.env.production`. Pas je ze aan, dan moet je opnieuw bouwen en deployen.

---

## 3. Stap 1: lokaal draaien (localhost)

Alles in dit hoofdstuk doe je op je laptop, in PowerShell.

Tijdens het ontwikkelen gebruik je gewoon de Vite-devserver:

```bash
npm run dev        # http://localhost:5173
```

Test de productie-container lokaal:

```bash
docker compose up --build
```

Open **http://localhost:8080** en controleer:

- De app laadt.
- Een subpagina (bijv. `/about`) werkt ook na een refresh. Zo weet je dat de SPA-fallback werkt.

Stoppen doe je met `Ctrl+C` of `docker compose down`.

---

## 4. Stap 2: deployen naar de Pi (thuisnetwerk)

Hoe het werkt: Ansible bouwt de app op je laptop (in Docker), kopieert de map `dist/` en de `Caddyfile` naar de Pi en start daar een standaard Caddy-container die die bestanden serveert. Op de Pi wordt niets gebouwd. Dat is sneller en werkt ook op 32-bit.

### `ansible/inventory.ini`

```ini
[pi]
192.168.1.50 ansible_user=pi
```

### `ansible/files/docker-compose.pi.yml`

Dit wordt de `docker-compose.yml` op de Pi:

```yaml
services:
  web:
    image: caddy:2-alpine
    ports:
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./dist:/srv:ro
    restart: unless-stopped
```

### `ansible/secrets.yml`

Voorlopig leeg; in stap 3 vul je het token in.

```yaml
cloudflare_tunnel_token: ""
```

### `ansible/deploy.yml`

```yaml
- name: React-app deployen naar Raspberry Pi
  hosts: pi
  become: true

  vars:
    app_dir: /opt/mijn-app
    project_root: "{{ playbook_dir }}/.."

  vars_files:
    - secrets.yml

  tasks:
    # --- Op de laptop ---
    - name: Oude build verwijderen
      delegate_to: localhost
      become: false
      run_once: true
      ansible.builtin.file:
        path: "{{ project_root }}/dist"
        state: absent

    - name: React-app bouwen in Docker en dist/ exporteren
      delegate_to: localhost
      become: false
      run_once: true
      ansible.builtin.command: docker build --target dist --output type=local,dest=dist .
      args:
        chdir: "{{ project_root }}"

    # --- Op de Pi ---
    - name: Controleren of Docker aanwezig is (zie 0.2)
      ansible.builtin.command: docker compose version
      changed_when: false

    - name: Gebruiker in de docker-groep
      ansible.builtin.user:
        name: "{{ ansible_user }}"
        groups: docker
        append: true

    - name: Appmap aanmaken
      ansible.builtin.file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ ansible_user }}"
        mode: "0755"

    - name: Gebouwde app synchroniseren
      become: false
      ansible.posix.synchronize:
        src: "{{ project_root }}/dist/"
        dest: "{{ app_dir }}/dist/"
        delete: true

    - name: Caddyfile plaatsen
      ansible.builtin.copy:
        src: "{{ project_root }}/Caddyfile"
        dest: "{{ app_dir }}/Caddyfile"
        owner: "{{ ansible_user }}"
        mode: "0644"
      notify: Caddy herstarten

    - name: Compose-bestand plaatsen
      ansible.builtin.copy:
        src: files/docker-compose.pi.yml
        dest: "{{ app_dir }}/docker-compose.yml"
        owner: "{{ ansible_user }}"
        mode: "0644"

    - name: Container starten
      ansible.builtin.command: docker compose up -d --remove-orphans
      args:
        chdir: "{{ app_dir }}"

    # --- Cloudflare Tunnel (stap 3), alleen als er een token is ---
    - name: Architectuur van de Pi bepalen
      ansible.builtin.command: dpkg --print-architecture
      register: pi_arch
      changed_when: false
      when: cloudflare_tunnel_token | length > 0

    - name: cloudflared installeren
      ansible.builtin.apt:
        deb: "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-{{ pi_arch.stdout }}.deb"
      when: cloudflare_tunnel_token | length > 0

    - name: cloudflared als service installeren
      ansible.builtin.command: cloudflared service install {{ cloudflare_tunnel_token }}
      args:
        creates: /etc/systemd/system/cloudflared.service
      no_log: true
      when: cloudflare_tunnel_token | length > 0

    # --- Controle ---
    - name: Controleren of de app reageert
      ansible.builtin.uri:
        url: http://localhost:80
        status_code: 200
      register: result
      retries: 10
      delay: 3
      until: result.status == 200

  handlers:
    - name: Caddy herstarten
      ansible.builtin.command: docker compose restart web
      args:
        chdir: "{{ app_dir }}"
```

### Deployen

In **WSL**, vanuit de projectmap:

```bash
cd /mnt/c/Users/<naam>/Code/mijn-app/ansible
ansible-playbook -i inventory.ini deploy.yml
```

Vraagt sudo op de Pi om een wachtwoord? Voeg dan `--ask-become-pass` toe. Op Raspbian is dat voor de gebruiker `pi` standaard niet nodig.

Daarna open je **http://192.168.1.50** vanaf elk apparaat in je netwerk.

**Een update uitrollen** is hetzelfde commando opnieuw draaien. De app wordt opnieuw gebouwd, alleen gewijzigde bestanden gaan naar de Pi, en Caddy serveert ze meteen.

### Handige commando's op de Pi (PuTTY of `ssh`)

```bash
cd /opt/mijn-app
docker compose ps              # status
docker compose logs -f web     # logs volgen
docker compose restart web     # herstarten
```

---

## 5. Stap 3: bereikbaar via internet (Cloudflare Tunnel)

Met een tunnel bouwt de Pi zelf een uitgaande verbinding op naar Cloudflare. Je hoeft **geen poorten open te zetten** in je router, het werkt ook achter CGNAT en je krijgt automatisch HTTPS.

`cloudflared` draait hier als gewone service op de Pi en niet als container, omdat dat op Buster en op 32-bit betrouwbaarder is.

**Wat je nodig hebt:** een (gratis) Cloudflare-account en een domein waarvan de DNS bij Cloudflare loopt.

1. Ga in het Cloudflare-dashboard naar **Zero Trust → Networks → Tunnels → Create a tunnel**.
2. Kies **Cloudflared**, geef de tunnel een naam (bijv. `pi-mijn-app`) en kopieer het **token** uit het installatiecommando. Dat is de lange string na `--token`.
3. Voeg een **Public Hostname** toe:
   - Subdomain: `app`, Domain: `jouwdomein.nl`
   - Service: `HTTP` → `localhost:80`
4. Zet het token in `ansible/secrets.yml`:

   ```yaml
   cloudflare_tunnel_token: "eyJhIjoi..."
   ```

5. Deploy opnieuw (in WSL):

   ```bash
   ansible-playbook -i inventory.ini deploy.yml
   ```

6. Open **https://app.jouwdomein.nl**.

**Optioneel:** wil je de app alleen voor jezelf of een paar mensen beschikbaar maken? Zet er dan een **Cloudflare Access**-policy voor (Zero Trust → Access → Applications), bijvoorbeeld met een login via e-mailcode.

### Alternatief zonder domein: Tailscale

Is de app alleen voor jezelf of een klein groepje? Dan kan het ook zonder domein. Voer dit uit op de Pi:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Daarna is de Pi bereikbaar vanaf al je apparaten die in je Tailscale-netwerk zitten. Publiek maken kan met `sudo tailscale funnel --bg 80`. Je krijgt dan een `https://<naam>.<tailnet>.ts.net`-adres.

---

## 6. Problemen oplossen

| Probleem | Oplossing |
|---|---|
| `sudo apt update` geeft 404-fouten | De Buster-bronnen staan in het archief. Zie 0.2, stap 2. |
| Docker-installatie faalt of `docker compose` bestaat niet | Buster wordt niet meer ondersteund door Docker. Flash opnieuw met Raspberry Pi OS Lite (64-bit). |
| Ansible meldt een Python-fout op de Pi | Controleer met `ansible --version` of je ansible-core 2.17 of lager gebruikt (zie 0.1). |
| `docker: command not found` in WSL | Zet in Docker Desktop de WSL integration aan voor je distributie. |
| Ansible kan niet verbinden | Test eerst `ssh pi@<ip>` in WSL. Vraagt die om een wachtwoord, doe dan 0.3 opnieuw. |
| Subpagina geeft een 404 na refresh | Controleer of `try_files {path} /index.html` in de `Caddyfile` staat. |
| `permission denied` op de Docker-socket bij handmatig gebruik | Log opnieuw in via SSH, zodat het lidmaatschap van de docker-groep actief wordt. |
| Tunnel is "Down" in het dashboard | Controleer op de Pi met `sudo systemctl status cloudflared` en `sudo journalctl -u cloudflared`. Meestal klopt het token niet. Nieuw token? Doe dan eerst `sudo cloudflared service uninstall` en deploy opnieuw. |

---

## 7. Volgende stappen (optioneel)

- **Upgraden naar een ondersteund OS:** flash Raspberry Pi OS Lite (64-bit). Deze handleiding blijft dan gewoon werken. Alleen de Docker-installatie (0.2) gaat soepeler en de Python-beperking voor Ansible vervalt.
- **Backend of API toevoegen:** voeg een extra service toe aan `docker-compose.pi.yml` en route `/api/*` ernaartoe met `reverse_proxy` in de `Caddyfile`. Let op dat het image ook voor de architectuur van je Pi bestaat.
- **Automatisch deployen:** een GitHub Actions-workflow die bij een push naar `main` bouwt en deployt.
- **Terraform:** handig zodra je de Cloudflare-kant (tunnel, DNS-records, Access-policies) als code wilt beheren met de Cloudflare-provider. Voor de Pi zelf blijft Ansible de juiste tool.
- **Monitoring:** Uptime Kuma als extra container houdt in de gaten of je app bereikbaar is.
