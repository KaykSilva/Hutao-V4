# Hutao V4

Bot de WhatsApp usando Baileys.

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Opcionalmente crie um arquivo `.env`:

```bash
cp .env.example .env
```

3. Inicie o bot:

```bash
npm start
```

4. Escaneie o QR Code pelo WhatsApp:

WhatsApp > Aparelhos conectados > Conectar um aparelho.

## Comandos

- `!menu` mostra o menu.
- `!ping` testa se o bot esta online.
- `!echo texto` repete uma mensagem.
- `!sticker` ou `!s` cria figurinha de imagem ou video.

Para criar figurinha, envie uma imagem/video com o comando na legenda ou responda uma imagem/video com `!s`.

Videos devem ter ate 10 segundos.

## Estrutura

```text
src/
  bot/        conexao com WhatsApp, estado e reconexao
  commands/   comandos do bot e aliases
  config/     leitura centralizada de variaveis de ambiente
  handlers/   entrada de eventos e roteamento de mensagens
  services/   regras reutilizaveis, integracoes e consumo de APIs
  utils/      helpers pequenos sem dependencia do dominio
```

Para adicionar um comando, crie um arquivo em `src/commands/` exportando `{ name, aliases, execute }` e registre em `src/commands/index.js`.

Para consumir APIs externas, prefira criar um service em `src/services/` e chamar esse service dentro do comando. Assim os comandos ficam finos e a integracao fica facil de testar ou trocar depois.

## Sessao

A sessao fica salva na pasta `auth/`. Se quiser conectar outra conta, pare o bot, apague a pasta `auth/` e rode `npm start` novamente.

## Deploy com GitHub Actions e PM2

Na VPS, deixe o repositorio clonado no caminho que sera usado em `APP_DIR`, crie o `.env` e conecte o WhatsApp uma vez.

Tambem instale os requisitos da VPS:

```bash
sudo apt update
sudo apt install -y git nodejs npm ffmpeg
npm install -g pm2
```

No GitHub, configure estes secrets em `Settings > Secrets and variables > Actions`:

- `VPS_HOST`: IP ou dominio da VPS.
- `VPS_USER`: usuario SSH.
- `VPS_PORT`: porta SSH, normalmente `22`.
- `VPS_SSH_KEY`: chave privada SSH usada para acessar a VPS.
- `APP_DIR`: caminho do projeto na VPS, por exemplo `/home/ubuntu/Hutao V4`.

Depois, cada push na branch `main` ou `master` faz deploy e reinicia o bot com PM2.
