# React-app deployen op een Raspberry Pi 4

Stappenplan: van `localhost` op je laptop, naar de Pi in je thuisnetwerk, naar bereikbaar via internet.

Deze handleiding gaat uit van:

- een **Windows-laptop**, met **WSL** voor Ansible
- een Pi 4 met **Raspberry Pi OS Lite (64-bit)**, headless (zonder scherm of toetsenbord)

**Stack**

| Onderdeel | Rol | Waar |
|---|---|---|
| React (Vite) | De app | laptop |
| Docker (multi-stage build) | Bouwt de app, en draait lokaal de testcontainer | laptop |
| Caddy | Webserver, met fallback voor client-side routing | container op de Pi |
| Docker Compose | Start de containers | laptop en Pi |
| Ansible | Richt de Pi in, bouwt, kopieert en (her)start met één commando | WSL op de laptop |
| Cloudflare Tunnel | Maakt de app publiek bereikbaar zonder port forwarding | service op de Pi |

**Waar voer je wat uit?**

- **PowerShell / VS Code-terminal (Windows):** `npm`- en `docker`-commando's om lokaal te ontwikkelen en te testen.
- **WSL:** SSH-sleutel, Ansible en deployen. Ansible logt zelf via SSH in op de Pi.
- **Op de Pi (`ssh` of PuTTY):** alleen af en toe een controle. Inrichten doet Ansible.

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
  pipx install ansible-core
  ansible-galaxy collection install ansible.posix
  ```

- In WSL: een SSH-sleutel. Die heb je nodig bij het flashen.

  ```bash
  ssh-keygen -t ed25519      # Enter bij alle vragen
  cat ~/.ssh/id_ed25519.pub  # deze regel kopieer je straks naar Imager
  ```

> **Tip:** je Windows-schijf staat in WSL onder `/mnt/c/`. Je project staat dus bijvoorbeeld in `/mnt/c/Users/<naam>/Code/mijn-app`.

### 0.2 De Raspberry Pi flashen

> **Let op:** bij flashen wordt alles op de SD-kaart gewist. Zet eerst alles wat je wilt bewaren van de Pi af.

1. Installeer **Raspberry Pi Imager** op Windows en kies:
   - Device: **Raspberry Pi 4**
   - OS: **Raspberry Pi OS (other) → Raspberry Pi OS Lite (64-bit)**
   - Storage: je SD-kaart
2. Kies **Edit settings** (OS customisation) en stel in:
   - **General:** hostname `raspberrypi`, gebruikersnaam en wachtwoord (in deze handleiding: `pi`), wifi met land `NL` en je tijdzone
   - **Services:** **Enable SSH → Allow public-key authentication only**, en plak de regel uit `~/.ssh/id_ed25519.pub`
3. Flash, steek de kaart in de Pi en start hem op. Na een paar minuten staat hij op je netwerk.
4. Zoek het IP-adres van de Pi op in je router en geef hem een **DHCP-reservering**, zodat het adres niet verandert. In de rest van de handleiding staat `192.168.1.50`. Vervang dat door jouw adres.

### 0.3 Verbinding testen (in WSL)

```bash
ssh pi@192.168.1.50
```

Kom je zonder wachtwoord binnen? Dan kan Ansible ook verbinden. Gebruik het IP-adres, want `raspberrypi.local` werkt vanuit WSL vaak niet. Vanuit PowerShell of PuTTY werkt `.local` meestal wel.

Kun je niet inloggen omdat er in Imager geen sleutel is ingesteld? Zet hem er dan alsnog op met `ssh-copy-id pi@192.168.1.50`.

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

Hoe het werkt: Ansible installeert de eerste keer Docker op de Pi. Daarna bouwt het de app op je laptop (in Docker), kopieert de map `dist/` en de `Caddyfile` naar de Pi en start daar een standaard Caddy-container die die bestanden serveert. Bouwen op je laptop is veel sneller dan op de Pi.

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

    # --- Pi inrichten ---
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

    # --- App plaatsen en starten ---
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
    - name: cloudflared installeren
      ansible.builtin.apt:
        deb: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
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

Op Raspberry Pi OS vraagt sudo standaard geen wachtwoord. Heb je dat wel ingesteld, voeg dan `--ask-become-pass` toe.

De eerste keer duurt het een paar minuten, omdat Docker geïnstalleerd wordt. Daarna open je **http://192.168.1.50** (of **http://raspberrypi.local**) vanaf elk apparaat in je netwerk.

**Een update uitrollen** is hetzelfde commando opnieuw draaien. De app wordt opnieuw gebouwd, alleen gewijzigde bestanden gaan naar de Pi, en Caddy serveert ze meteen.

### Handige commando's op de Pi (`ssh` of PuTTY)

```bash
cd /opt/mijn-app
docker compose ps              # status
docker compose logs -f web     # logs volgen
docker compose restart web     # herstarten
```

---

## 5. Stap 3: bereikbaar via internet (Cloudflare Tunnel)

Met een tunnel bouwt de Pi zelf een uitgaande verbinding op naar Cloudflare. Je hoeft **geen poorten open te zetten** in je router, het werkt ook achter CGNAT en je krijgt automatisch HTTPS.

`cloudflared` draait als systeemservice op de Pi, los van de app-container. Zo blijft de tunnel draaien als je de app herstart.

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
| Pi verschijnt niet op het netwerk | Controleer in Imager de wifi-instellingen en het land. Of sluit de Pi de eerste keer aan met een netwerkkabel. |
| `docker: command not found` in WSL | Zet in Docker Desktop de WSL integration aan voor je distributie. |
| Ansible kan niet verbinden | Test eerst `ssh pi@<ip>` in WSL. Vraagt die om een wachtwoord of weigert hij, zet de sleutel er dan op met `ssh-copy-id` (zie 0.3). |
| `raspberrypi.local` niet gevonden | Gebruik het IP-adres. Vanuit WSL werkt mDNS vaak niet. |
| Subpagina geeft een 404 na refresh | Controleer of `try_files {path} /index.html` in de `Caddyfile` staat. |
| `permission denied` op de Docker-socket bij handmatig gebruik | Log opnieuw in via SSH, zodat het lidmaatschap van de docker-groep actief wordt. |
| Tunnel is "Down" in het dashboard | Controleer op de Pi met `sudo systemctl status cloudflared` en `sudo journalctl -u cloudflared`. Meestal klopt het token niet. Nieuw token? Doe dan eerst `sudo cloudflared service uninstall` en deploy opnieuw. |

---

## 7. Volgende stappen (optioneel)

- **Backend of API toevoegen:** voeg een extra service toe aan `docker-compose.pi.yml` en route `/api/*` ernaartoe met `reverse_proxy` in de `Caddyfile`. Bouw het image op je laptop voor arm64 (`docker buildx build --platform linux/arm64 ...`) en push het naar een registry zoals GitHub Container Registry.
- **Automatisch deployen:** een GitHub Actions-workflow die bij een push naar `main` bouwt en deployt.
- **Terraform:** handig zodra je de Cloudflare-kant (tunnel, DNS-records, Access-policies) als code wilt beheren met de Cloudflare-provider. Voor de Pi zelf blijft Ansible de juiste tool.
- **Monitoring:** Uptime Kuma als extra container houdt in de gaten of je app bereikbaar is.
