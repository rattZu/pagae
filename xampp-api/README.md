# API Pagae para XAMPP

## Iniciar no Linux

Inicie o Apache e o MySQL com:

`sudo /opt/lampp/lampp start`

Para abrir o painel gráfico do XAMPP:

`sudo /opt/lampp/manager-linux-x64.run`

http://localhost/phpmyadmin/

1. Copie esta pasta para `C:\xampp\htdocs\pagae-api`.
2. Inicie Apache e MySQL no painel do XAMPP.
3. Abra o phpMyAdmin em `http://localhost/phpmyadmin`.
4. Importe o arquivo `database.sql`.
5. Confira `config.php`: por padrão o MySQL do XAMPP usa usuário `root` sem senha.
6. No navegador, rode o Ionic com `npm start` e abra `http://localhost:4200`.
7. A API local fica em `http://localhost/pagae-api/auth.php`.

## Usar no celular Android

1. Deixe Apache e MySQL ligados no computador que hospeda esta API.
2. Conecte o celular e o computador na mesma rede Wi-Fi.
3. Descubra o IPv4 do computador (`ipconfig` no Windows ou `ip addr` no Linux).
4. Coloque esse IP em `src/environments/environment.ts` e `src/environments/environment.prod.ts`, por exemplo:

	`http://192.168.1.17/pagae-api/auth.php`

5. Libere o Apache no firewall e teste no navegador do celular se a URL responde.
6. Gere e instale o APK na raiz do projeto:

	`npm run android:build`

	`npm run android:install`

O celular precisa permanecer na mesma rede Wi-Fi e o computador precisa continuar ligado. Para funcionar por 4G/5G, hospede esta API e o MySQL em um servidor público, use HTTPS e substitua as URLs dos ambientes pela URL pública.

## Banco de dados

O arquivo `database.sql` cria as tabelas `users`, `auth_tokens`, `loans` e `loan_payments`. Se o banco `pagae` já existia, execute novamente no phpMyAdmin apenas os comandos `CREATE TABLE` das duas últimas tabelas, ou importe o arquivo completo: os comandos usam `IF NOT EXISTS`.

Empréstimos e recebimentos agora são associados ao usuário autenticado e ficam no MySQL. Assim, o mesmo usuário consegue acessar os dados em outro celular usando a mesma API.

## Acesso público temporário

Para expor a API temporariamente, mantenha Apache e MySQL ativos e execute:

`/home/vboxuser/.local/bin/cloudflared tunnel --url http://127.0.0.1:80`

Alternativa validada para esta sessão:

`npx localtunnel --port 80`

URL atual do APK:

`https://plain-bobcats-battle.loca.lt/pagae-api/auth.php`

Use a URL gerada pelo comando no arquivo de ambiente do app. Ela muda quando o túnel é encerrado; para produção, use hospedagem permanente com HTTPS.

O botão de demonstração cria automaticamente a conta:

- E-mail: `demo@empresta.app`
- Senha: `123456`

No Android Emulator, altere `authApiUrl` em `src/environments/environment.ts` para:

`http://10.0.2.2/pagae-api/auth.php`

Em um celular físico, use o IP da máquina que executa o XAMPP, por exemplo:

`http://192.168.0.10/pagae-api/auth.php`

As senhas são protegidas no servidor com `password_hash`. O aplicativo recebe apenas um token de sessão e os dados públicos do usuário.
