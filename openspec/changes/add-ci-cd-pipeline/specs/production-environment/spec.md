# Spec Delta

## Purpose

Define o ambiente de produção onde o app fica acessível na web: um endereço HTTPS que serve a interface e a API na mesma origem, protegido por credenciais até o app ter login, com dados que sobrevivem aos deploys.

## ADDED Requirements

### Requirement: Endereço público com HTTPS

A produção SHALL servir o app num endereço público com HTTPS e certificado válido. Requisições por HTTP SHALL ser redirecionadas para HTTPS.

#### Scenario: Acesso por HTTPS

- **WHEN** o usuário abre o endereço do app com HTTPS e informa as credenciais
- **THEN** o navegador aceita o certificado sem aviso e mostra a lista de projetos

#### Scenario: Acesso por HTTP

- **WHEN** o usuário abre o endereço do app com HTTP
- **THEN** a resposta redireciona para o mesmo endereço com HTTPS

### Requirement: API na mesma origem do app

A API SHALL responder sob o caminho `/api` do mesmo endereço do app, com as mesmas rotas e respostas que o backend expõe na raiz. A interface SHALL buscar e alterar dados só por esse caminho, sem chamar outra origem.

#### Scenario: Rota da API pelo endereço do app

- **WHEN** um cliente autenticado faz `GET /api/projects` no endereço do app
- **THEN** a resposta é a lista de projetos, igual à de `GET /projects` no backend

#### Scenario: Interface usa só a própria origem

- **WHEN** o usuário cria um projeto pela interface em produção
- **THEN** todas as requisições do navegador vão para o endereço do app, sob `/api`

### Requirement: Acesso protegido por credenciais

Toda requisição à produção, exceto `GET /api/health`, SHALL exigir usuário e senha válidos. Sem credenciais válidas, a resposta SHALL ser 401 e não SHALL conter dados do app.

#### Scenario: Sem credenciais

- **WHEN** alguém abre a página inicial ou chama `GET /api/projects` sem credenciais
- **THEN** a resposta é 401, sem dados de projetos ou cards

#### Scenario: Senha errada

- **WHEN** alguém informa o usuário certo com a senha errada
- **THEN** a resposta é 401

#### Scenario: Credenciais válidas

- **WHEN** o usuário informa as credenciais válidas
- **THEN** o app funciona como em desenvolvimento: lista, cria, move e exclui projetos e cards

#### Scenario: Verificação de saúde aberta

- **WHEN** alguém chama `GET /api/health` sem credenciais
- **THEN** a resposta é 200, sem dados de projetos ou cards

### Requirement: Credenciais fora do código e das imagens

As credenciais de acesso SHALL ficar fora do repositório e das imagens. Trocar a senha SHALL valer a partir do deploy seguinte, sem reconstruir imagens.

#### Scenario: Troca de senha

- **WHEN** o operador troca a senha guardada e um deploy roda
- **THEN** a senha nova passa a valer e a antiga passa a receber 401

### Requirement: Dados preservados entre deploys

Projetos e cards SHALL continuar existindo depois de um deploy, de um rollback e de uma reinicialização do servidor.

#### Scenario: Deploy de nova versão

- **WHEN** o usuário cria um projeto e depois uma nova versão é implantada
- **THEN** o projeto e os seus cards continuam no quadro, nas mesmas colunas e posições

#### Scenario: Servidor reiniciado

- **WHEN** o servidor de produção reinicia
- **THEN** o app volta a responder sozinho, com os mesmos projetos e cards

### Requirement: Migrações antes de servir

Antes de a nova versão do backend atender requisições, as migrações pendentes do banco SHALL estar aplicadas. Se uma migração falhar, a nova versão SHALL NOT atender requisições.

#### Scenario: Versão com migração nova

- **WHEN** é implantada uma versão que traz uma migração nova
- **THEN** a migração é aplicada antes de o backend responder a `GET /api/health`

#### Scenario: Migração falha

- **WHEN** uma migração falha na subida da nova versão
- **THEN** a nova versão não atende requisições e o deploy é tratado como falha

### Requirement: Superfície exposta mínima

Da internet, a produção SHALL aceitar conexões só nas portas HTTP e HTTPS. O banco SHALL NOT aceitar conexões de fora do servidor, e o acesso administrativo por SSH SHALL ficar restrito ao endereço do operador.

#### Scenario: Banco a partir da internet

- **WHEN** alguém tenta conectar na porta do Postgres pelo endereço público
- **THEN** a conexão não é aceita

#### Scenario: SSH de outro endereço

- **WHEN** alguém tenta abrir SSH de um endereço diferente do configurado para o operador
- **THEN** a conexão não é aceita
