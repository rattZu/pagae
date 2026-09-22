# Empréstimos entre Amigos

Aplicativo mobile desenvolvido com Ionic + Angular para controlar dinheiro emprestado entre amigos e familiares.

## Objetivo
Este projeto simula um app de controle financeiro com foco em empréstimos pessoais, permitindo registrar quem recebeu dinheiro, quanto foi levado, quanto já foi pago e o saldo pendente.

## Funcionalidades principais
- Sistema de login e senha
- Cadastro de usuários
- Login de demonstração para testes rápidos
- Persistência local de dados com localStorage
- Cadastro de empréstimos
- Registro de pagamentos
- Dashboard com resumo financeiro
- Lista de pessoas com valores pendentes
- Navegação entre telas do app mobile
- Design responsivo e mobile-first

## Stack
- Ionic
- Angular
- TypeScript
- localStorage para persistência de dados

## Requisitos do projeto
A aplicação foi pensada para atender ao contexto do trabalho final de faculdade:
- app mobile com Ionic + Angular
- login com senha
- segurança básica e armazenamento local
- uso de persistência em ambiente cliente, já que o Ionic não se comunica diretamente com banco de dados
- fluxo de navegação funcional para apresentação em celular
- possibilidade de build local para Android/iOS em casa, conforme orientação do professor

## Como rodar
1. Instale as dependências:
   npm install
2. Inicie o servidor:
   npm start
3. Acesse no navegador:
   http://localhost:4200/

Para acessar pelo celular, use o IP da máquina na mesma rede Wi‑Fi:
http://192.168.1.3:4200/

## Gerar APK Android
Com Java e Android SDK instalados, gere o APK de teste com:

   npm run android:build

O arquivo instalável será criado em:

   android/app/build/outputs/apk/debug/app-debug.apk

Com um celular conectado e a depuração USB ativada, instale diretamente com:

   npm run android:install

## Observações
- Os dados ficam salvos localmente no navegador/dispositivo via localStorage.
- Para um ambiente real de produção, seria recomendada integração com backend e banco de dados seguro.
- A versão atual é um MVP funcional voltado para apresentação acadêmica e validação de fluxo.
