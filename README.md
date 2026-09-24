# Empréstimos entre Amigos

Aplicativo mobile desenvolvido com Ionic + Angular para controlar dinheiro emprestado entre amigos e familiares.

## Objetivo
Este projeto simula um app de controle financeiro com foco em empréstimos pessoais, permitindo registrar quem recebeu dinheiro, quanto foi levado, quanto já foi pago e o saldo pendente.

## Funcionalidades principais
- Sistema de login e senha
- Cadastro de usuários
- Login de demonstração para testes rápidos
- Autenticação por token, com API própria e banco de dados MySQL
- Cadastro de empréstimos
- Registro de pagamentos
- Cálculo automático de juros por atraso
- Dashboard com resumo financeiro
- Lista de pessoas com valores pendentes
- Navegação entre telas do app mobile
- Design responsivo e mobile-first

## Stack
- Ionic
- Angular
- TypeScript
- Capacitor (build de APK Android)
- Node.js + Express (API)
- MySQL via Docker Compose

## Requisitos do projeto
A aplicação foi pensada para atender ao contexto do trabalho final de faculdade:
- app mobile com Ionic + Angular
- login com senha
- backend próprio com autenticação e persistência em banco de dados
- fluxo de navegação funcional para apresentação em celular
- possibilidade de build local para Android/iOS em casa, conforme orientação do professor

## Como rodar

### Backend (API + banco de dados)
1. Suba o MySQL com Docker:
   ```
   cd server
   docker compose up -d
   ```
2. Instale as dependências e inicie a API:
   ```
   npm install
   npm run dev
   ```
   A API sobe em `http://localhost:4000`, com as rotas `/auth` e `/loans`.

### Frontend
1. Instale as dependências:
   ```
   npm install
   ```
2. Configure as URLs da API em `src/environments/environment.ts` (`authApiUrl` e `loansApiUrl`) apontando para o backend.
3. Inicie o servidor:
   ```
   npm start
   ```
4. Acesse no navegador:
   http://localhost:4200/

Para acessar pelo celular na mesma rede Wi-Fi, use o IP da máquina, por exemplo:
http://192.168.1.3:4200/

Para acesso fora da rede local (ex.: celular físico com APK instalado), exponha a API com um túnel, por exemplo:
```
cloudflared tunnel --url http://localhost:4000
```
e use a URL gerada (`*.trycloudflare.com`) em `authApiUrl`/`loansApiUrl`.

## Gerar APK Android
Com Java e Android SDK instalados, gere o APK de teste com:

   npm run android:build

O arquivo instalável será criado em:

   android/app/build/outputs/apk/debug/app-debug.apk

Com um celular conectado e a depuração USB ativada, instale diretamente com:

   npm run android:install

## Observações
- A sessão do usuário (token) fica salva localmente no dispositivo; os dados de empréstimos e usuários ficam persistidos no MySQL, via API própria.
- A versão atual é um MVP funcional voltado para apresentação acadêmica e validação de fluxo.
