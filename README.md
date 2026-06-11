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

## Sessao

A sessao fica salva na pasta `auth/`. Se quiser conectar outra conta, pare o bot, apague a pasta `auth/` e rode `npm start` novamente.
