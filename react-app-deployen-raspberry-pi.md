# React-app deployen op een Raspberry Pi 4

Stappenplan: van `localhost` op je laptop, naar de Pi in je thuisnetwerk, naar bereikbaar via internet.

**Stack**

| Onderdeel | Rol |
|---|---|
| React (Vite) | De app |
| Docker (multi-stage build) | Bouwt de app en serveert de statische bestanden |
| Caddy | Webserver in de container, met fallback voor client-side routing |
| Docker Compose | Beschrijft de services, op je laptop en op de Pi hetzelfde |
| Ansible | Richt de Pi in en deployt met één commando |
| Cloudflare Tunnel | Maakt de app publiek bereikbaar zonder port forwarding |

---

## 0. Voorbereiding

### Op je laptop

- **Node.js 20+** en **npm**
- **Docker Desktop** (of Docker Engine op Linux)
- **Ansible**. Op macOS of Linux: `pipx install ansible` of `brew install ansible`. Op Windows: gebruik WSL.
- De Ansible-collectie voor rsync:

  ```bash
  ansible-galaxy collection install ansible.posix
  ```

### De Raspberry Pi 4

1. Flash **Raspberry Pi OS Lite (64-bit)** met **Raspberry Pi Imager**.
2. Stel in de Imager-instellingen (tandwiel) het volgende in:
   - hostname: `raspberrypi`
   - gebruikersnaam en wachtwoord (in deze handleiding: `pi`)
   - **SSH aan**, bij voorkeur met je publieke SSH-sleutel
   - wifi, als je geen kabel gebruikt
3. Start de Pi en test vanaf je laptop:

   ```bash
   ssh pi@raspberrypi.local
   ```

   Werkt `.local` niet? Zoek dan het IP-adres op in je router en gebruik dat. Een vast IP of een DHCP-reservering is handig.

4. Heb je nog geen SSH-sleutel op de Pi gezet? Doe dat dan nu:

   ```bash
   ssh-copy-id pi@raspberrypi.local
   ```

---

## 1. Projectstructuur

```
mijn-app/
├── src/                   # React-code (Vite)
├── public/
├── index.html
├── package.json
├── package-lock.json
├── Dockerfile
├── .dockerignore
├── Caddyfile
├── docker-compose.yml
├── .env                   # lokaal, niet committen
└── ansible/
    ├── inventory.ini
    ├── deploy.yml
    └── files/
        └── app.env        # .env voor de Pi, niet committen
```

Heb je nog geen React-app? Maak er dan een aan:

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
ansible/files/app.env
```

---

## 2. De app containeriseren

### `Dockerfile`

Een multi-stage build. Stap 1 bouwt de React-app met Node, stap 2 serveert alleen het resultaat (`dist/`) met Caddy. Het uiteindelijke image is klein en bevat geen Node.

```dockerfile
# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage ---
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

### `docker-compose.yml`

```yaml
services:
  web:
    build: .
    ports:
      - "${WEB_PORT:-8080}:80"
    restart: unless-stopped

  # Alleen actief als COMPOSE_PROFILES=tunnel in .env staat (stap 5)
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - web
    restart: unless-stopped
    profiles: ["tunnel"]
```

> **Let op bij omgevingsvariabelen in React:** variabelen als `VITE_API_URL` worden tijdens `npm run build` in de JavaScript gebakken. Ze zijn dus build-time, niet runtime. Pas je ze aan, dan moet je opnieuw bouwen.

---

## 3. Stap 1: lokaal draaien (localhost)

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

### `ansible/inventory.ini`

```ini
[pi]
raspberrypi.local ansible_user=pi
```

### `ansible/files/app.env`

Dit is de `.env` die op de Pi komt te staan:

```env
WEB_PORT=80
# Voor stap 5:
# COMPOSE_PROFILES=tunnel
# CLOUDFLARE_TUNNEL_TOKEN=plak-hier-je-token
```

### `ansible/deploy.yml`

```yaml
- name: React-app deployen naar Raspberry Pi
  hosts: pi
  become: true

  vars:
    app_dir: /opt/mijn-app
    project_root: "{{ playbook_dir }}/.."

  tasks:
    - name: Basispackages installeren
      ansible.builtin.apt:
        name: [rsync, curl]
        state: present
        update_cache: true
        cache_valid_time: 3600

    - name: Docker installeren via het officiële script
      ansible.builtin.shell: curl -fsSL https://get.docker.com | sh
      args:
        creates: /usr/bin/docker

    - name: Docker starten en bij boot inschakelen
      ansible.builtin.service:
        name: docker
        state: started
        enabled: true

    - name: Gebruiker toevoegen aan de docker-groep
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

    - name: Projectbestanden synchroniseren
      become: false
      ansible.posix.synchronize:
        src: "{{ project_root }}/"
        dest: "{{ app_dir }}/"
        delete: true
        rsync_opts:
          - "--exclude=node_modules"
          - "--exclude=dist"
          - "--exclude=.git"
          - "--exclude=ansible"
          - "--exclude=.env"

    - name: .env voor de Pi plaatsen
      ansible.builtin.copy:
        src: files/app.env
        dest: "{{ app_dir }}/.env"
        owner: "{{ ansible_user }}"
        mode: "0600"

    - name: App bouwen en (her)starten
      ansible.builtin.command: docker compose up -d --build --remove-orphans
      args:
        chdir: "{{ app_dir }}"

    - name: Oude images opruimen
      ansible.builtin.command: docker image prune -f

    - name: Controleren of de app reageert
      ansible.builtin.uri:
        url: http://localhost:80
        status_code: 200
      register: result
      retries: 10
      delay: 3
      until: result.status == 200
```

### Deployen

Vanuit de projectmap:

```bash
cd ansible
ansible-playbook -i inventory.ini deploy.yml --ask-become-pass
```

`--ask-become-pass` heb je alleen nodig als sudo op de Pi om een wachtwoord vraagt. Bij Raspberry Pi OS is dat standaard niet zo.

De eerste keer duurt het een paar minuten, omdat Docker geïnstalleerd en het image gebouwd moet worden. Daarna open je **http://raspberrypi.local** (of `http://<ip-van-de-pi>`) vanaf elk apparaat in je netwerk.

**Een update uitrollen** is hetzelfde commando opnieuw draaien. Alleen gewijzigde bestanden worden gekopieerd en de container wordt opnieuw gebouwd.

### Handige commando's op de Pi

```bash
ssh pi@raspberrypi.local
cd /opt/mijn-app
docker compose ps              # status
docker compose logs -f web     # logs volgen
docker compose restart web     # herstarten
```

---

## 5. Stap 3: bereikbaar via internet (Cloudflare Tunnel)

Met een tunnel bouwt de Pi zelf een uitgaande verbinding op naar Cloudflare. Je hoeft **geen poorten open te zetten** in je router, het werkt ook achter CGNAT en je krijgt automatisch HTTPS.

**Wat je nodig hebt:** een (gratis) Cloudflare-account en een domein waarvan de DNS bij Cloudflare loopt.

1. Ga in het Cloudflare-dashboard naar **Zero Trust → Networks → Tunnels → Create a tunnel**.
2. Kies **Cloudflared**, geef de tunnel een naam (bijv. `pi-mijn-app`) en kopieer het **token** uit het installatiecommando. Dat is de lange string na `--token`.
3. Voeg een **Public Hostname** toe:
   - Subdomain: `app`, Domain: `jouwdomein.nl`
   - Service: `HTTP` → `web:80`

   Hier is `web` de naam van de service in `docker-compose.yml`. De twee containers vinden elkaar via het Docker-netwerk.
4. Zet het profiel en het token in `ansible/files/app.env`:

   ```env
   WEB_PORT=80
   COMPOSE_PROFILES=tunnel
   CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
   ```

5. Deploy opnieuw:

   ```bash
   ansible-playbook -i inventory.ini deploy.yml
   ```

6. Open **https://app.jouwdomein.nl**.

**Optioneel:** wil je de app alleen voor jezelf of een paar mensen beschikbaar maken? Zet er dan een **Cloudflare Access**-policy voor (Zero Trust → Access → Applications), bijvoorbeeld met een login via e-mailcode.

### Alternatief zonder domein: Tailscale

Is de app alleen voor jezelf of een klein groepje? Dan kan het ook zonder domein:

```bash
# op de Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Daarna is de Pi bereikbaar vanaf al je apparaten die in je Tailscale-netwerk zitten. Publiek maken kan met `sudo tailscale funnel --bg 80`. Je krijgt dan een `https://<naam>.<tailnet>.ts.net`-adres.

---

## 6. Problemen oplossen

| Probleem | Oplossing |
|---|---|
| `npm ci` faalt of de Pi loopt vast tijdens het bouwen | Te weinig geheugen. Vergroot de swap: in `/etc/dphys-swapfile` zet je `CONF_SWAPSIZE=2048`, daarna `sudo systemctl restart dphys-swapfile`. Of bouw op je laptop (zie hieronder). |
| Subpagina geeft een 404 na refresh | Controleer of `try_files {path} /index.html` in de `Caddyfile` staat. |
| `raspberrypi.local` niet gevonden | Gebruik het IP-adres. Op Windows werkt mDNS soms niet zonder Bonjour. |
| `permission denied` op de Docker-socket bij handmatig gebruik | Log opnieuw in via SSH, zodat het lidmaatschap van de docker-groep actief wordt. |
| Tunnel is "Down" in het dashboard | `docker compose logs cloudflared`. Meestal klopt het token niet, of ontbreekt `COMPOSE_PROFILES=tunnel`. |

### Bouwen op je laptop in plaats van op de Pi

Wordt de app groter en duurt het bouwen op de Pi te lang? Bouw dan op je laptop voor ARM64 en push het image naar een registry (bijv. GitHub Container Registry):

```bash
docker buildx build --platform linux/arm64 -t ghcr.io/<gebruiker>/mijn-app:latest --push .
```

Vervang in `docker-compose.yml` dan `build: .` door `image: ghcr.io/<gebruiker>/mijn-app:latest`, en gebruik in het playbook `docker compose pull && docker compose up -d`.

---

## 7. Volgende stappen (optioneel)

- **Backend of API toevoegen:** voeg een extra service toe aan `docker-compose.yml` en route `/api/*` ernaartoe met `reverse_proxy` in de `Caddyfile`.
- **Automatisch deployen:** een GitHub Actions-workflow die bij een push naar `main` het image bouwt en pusht. Op de Pi haalt Watchtower nieuwe images dan automatisch op, of je triggert het playbook.
- **Terraform:** handig zodra je de Cloudflare-kant (tunnel, DNS-records, Access-policies) als code wilt beheren met de Cloudflare-provider. Voor de Pi zelf blijft Ansible de juiste tool.
- **Monitoring:** Uptime Kuma als extra container houdt in de gaten of je app bereikbaar is.
