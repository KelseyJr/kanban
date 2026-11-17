# projects Specification

## Purpose

Organiza o trabalho em projetos independentes: cada projeto agrupa seus próprios cards e tem seu próprio quadro kanban, para acompanhar mais de um repositório sem misturar as atividades.

## Requirements

### Requirement: Criar projeto

O sistema SHALL permitir criar um projeto informando um nome. O sistema SHALL remover os espaços das pontas do nome e aceitá-lo apenas se tiver de 1 a 80 caracteres.

#### Scenario: Projeto criado com nome válido

- **WHEN** o usuário cria um projeto com o nome "kanban"
- **THEN** o projeto "kanban" aparece na lista de projetos

#### Scenario: Espaços das pontas são removidos

- **WHEN** o usuário cria um projeto com o nome "  kanban  "
- **THEN** o projeto é salvo com o nome "kanban"

#### Scenario: Nome em branco é rejeitado

- **WHEN** o usuário tenta criar um projeto com o nome vazio ou só com espaços
- **THEN** o sistema rejeita com uma mensagem de validação
- **AND** nenhum projeto é criado

#### Scenario: Nome com mais de 80 caracteres é rejeitado

- **WHEN** o usuário tenta criar um projeto com um nome de 81 caracteres
- **THEN** o sistema rejeita com uma mensagem de validação
- **AND** nenhum projeto é criado

### Requirement: Nome de projeto único

O sistema SHALL impedir que dois projetos tenham o mesmo nome, sem diferenciar maiúsculas de minúsculas.

#### Scenario: Nome já usado

- **GIVEN** existe o projeto "Kanban"
- **WHEN** o usuário tenta criar um projeto com o nome "kanban"
- **THEN** o sistema rejeita informando que já existe um projeto com esse nome
- **AND** nenhum projeto é criado

### Requirement: Listar projetos

O sistema SHALL listar todos os projetos em ordem alfabética, sem diferenciar maiúsculas de minúsculas, e cada item da lista SHALL abrir o quadro do projeto.

#### Scenario: Lista em ordem alfabética

- **GIVEN** existem os projetos "site", "Api" e "kanban"
- **WHEN** o usuário abre a página inicial
- **THEN** vê os projetos na ordem "Api", "kanban", "site"

#### Scenario: Nenhum projeto cadastrado

- **GIVEN** não existe nenhum projeto
- **WHEN** o usuário abre a página inicial
- **THEN** vê uma mensagem informando que ainda não há projetos
- **AND** vê o formulário para criar o primeiro projeto

#### Scenario: Abrir o quadro de um projeto

- **WHEN** o usuário seleciona o projeto "kanban" na lista
- **THEN** o quadro do projeto "kanban" é aberto

### Requirement: Renomear projeto

O sistema SHALL permitir renomear um projeto com as mesmas regras de nome da criação, sem alterar os cards do projeto.

#### Scenario: Projeto renomeado

- **GIVEN** existe o projeto "kanban" com 3 cards
- **WHEN** o usuário renomeia o projeto para "kanban-app"
- **THEN** a lista mostra "kanban-app" no lugar de "kanban"
- **AND** o quadro de "kanban-app" mantém os mesmos 3 cards nas mesmas colunas e posições

#### Scenario: Nome inválido mantém o nome atual

- **GIVEN** existe o projeto "kanban"
- **WHEN** o usuário tenta renomeá-lo para um nome em branco
- **THEN** o sistema rejeita com uma mensagem de validação
- **AND** o projeto continua com o nome "kanban"

#### Scenario: Nome de outro projeto é rejeitado

- **GIVEN** existem os projetos "kanban" e "site"
- **WHEN** o usuário tenta renomear "site" para "KANBAN"
- **THEN** o sistema rejeita informando que já existe um projeto com esse nome
- **AND** o projeto continua com o nome "site"

#### Scenario: Trocar só maiúsculas e minúsculas é permitido

- **GIVEN** existe o projeto "kanban"
- **WHEN** o usuário o renomeia para "Kanban"
- **THEN** o projeto passa a se chamar "Kanban"

### Requirement: Excluir projeto

O sistema SHALL permitir excluir um projeto somente após confirmação explícita do usuário. A exclusão SHALL remover também todos os cards do projeto e não pode ser desfeita.

#### Scenario: Exclusão confirmada

- **GIVEN** existe o projeto "site" com 2 cards
- **WHEN** o usuário pede para excluir "site" e confirma
- **THEN** "site" deixa de aparecer na lista de projetos
- **AND** os 2 cards de "site" deixam de existir

#### Scenario: Exclusão cancelada

- **GIVEN** existe o projeto "site"
- **WHEN** o usuário pede para excluir "site" e cancela a confirmação
- **THEN** "site" continua na lista com todos os seus cards

### Requirement: Projeto inexistente

O sistema SHALL responder "não encontrado", sem alterar nenhum dado, a qualquer operação sobre um projeto que não existe.

#### Scenario: Abrir o quadro de um projeto excluído

- **GIVEN** o projeto "site" foi excluído
- **WHEN** o usuário abre o endereço do quadro de "site"
- **THEN** vê a mensagem "Projeto não encontrado"
- **AND** vê um link para a lista de projetos

#### Scenario: Operação em projeto inexistente

- **WHEN** uma requisição tenta renomear ou excluir um projeto inexistente, ou criar um card nele
- **THEN** o sistema responde "não encontrado"
- **AND** nenhum dado é alterado
