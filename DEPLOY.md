# Deploy do AGU Serviços na sua máquina / intranet AGU

Este guia mostra como rodar o sistema localmente ou em um servidor interno
da AGU. Lembre-se: hoje o app é **100% frontend** (dados em `localStorage`).
Para virar sistema corporativo será necessário backend, banco e integração
com o AD/ADFS da AGU.

---

## Pré-requisitos

- **Node.js 20+** (https://nodejs.org)
- **npm** (já vem com o Node)
- _(opcional)_ **Docker** para empacotar a aplicação

---

## Opção 1 — Rodar direto com Node (mais simples)

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Build de produção
npm run build

# 3. Iniciar o servidor
node .output/server/index.mjs
```

Acesse em **http://localhost:8080**

Para testar antes de buildar (modo desenvolvimento):

```bash
npm run dev
```

---

## Opção 2 — Rodar com Docker (recomendado para servidor)

```bash
# Build da imagem
docker build -t agu-servicos .

# Subir o container
docker run -d --name agu-servicos -p 8080:8080 --restart unless-stopped agu-servicos
```

Acesse em **http://SEU-SERVIDOR:8080**

Para parar / reiniciar:
```bash
docker stop agu-servicos
docker start agu-servicos
docker logs -f agu-servicos
```

---

## Opção 3 — Servir atrás de um Nginx interno da AGU

Se a AGU já tem um Nginx/IIS na frente, basta fazer **proxy reverso** para
a porta 8080 do container ou do Node:

```nginx
server {
    listen 80;
    server_name aguservicos.agu.gov.br;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Variáveis de ambiente

| Variável | Padrão  | Descrição                   |
|----------|---------|-----------------------------|
| `PORT`   | `8080`  | Porta HTTP do servidor      |
| `HOST`   | `0.0.0.0` | Interface de bind         |

Exemplo:
```bash
PORT=3000 node .output/server/index.mjs
```

---

## Próximos passos para virar produção

1. Habilitar **Lovable Cloud** (banco + auth) ou backend próprio na AGU
2. Trocar o login mockado por **SAML/OIDC contra o ADFS/Entra ID** da AGU
3. Persistir solicitações em **PostgreSQL** (tabelas + RLS por perfil)
4. Configurar **e-mail institucional** para notificações e recuperação
5. Apontar o domínio **aguservicos.agu.gov.br** para o servidor

---

## Suporte

Em caso de erro no build, rode:
```bash
node -v   # precisa ser 20+
npm cache clean --force
rm -rf node_modules .output
npm install --legacy-peer-deps
npm run build
```
