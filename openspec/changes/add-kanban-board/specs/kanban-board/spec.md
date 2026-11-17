# Spec Delta

## Purpose

Quadro kanban de um projeto que espelha o fluxo do OpenSpec: um backlog seguido de uma coluna por etapa (Explore, Propose, Apply, Archive), onde cada atividade é um card que o usuário move conforme as etapas terminam.

## ADDED Requirements

### Requirement: Colunas fixas do fluxo OpenSpec

O quadro de cada projeto SHALL exibir exatamente cinco colunas, nesta ordem: Backlog, Explore, Propose, Apply e Archive. Cada coluna SHALL mostrar seu nome e a quantidade de cards que contém, inclusive quando está vazia.

#### Scenario: Quadro de projeto sem cards

- **GIVEN** o projeto "kanban" não tem cards
- **WHEN** o usuário abre o quadro de "kanban"
- **THEN** vê as colunas Backlog, Explore, Propose, Apply e Archive, nessa ordem
- **AND** cada coluna mostra 0 cards

#### Scenario: Contagem por coluna

- **GIVEN** o projeto tem 3 cards no Backlog e 1 card em Apply
- **WHEN** o usuário abre o quadro
- **THEN** Backlog mostra 3, Apply mostra 1 e as demais colunas mostram 0

### Requirement: Criar card no Backlog

O sistema SHALL permitir criar um card com título obrigatório, de 1 a 120 caracteres depois de removidos os espaços das pontas, e descrição opcional de até 5.000 caracteres. Todo card novo SHALL entrar no fim da coluna Backlog.

#### Scenario: Card criado no fim do Backlog

- **GIVEN** o Backlog tem o card "A"
- **WHEN** o usuário cria o card "B"
- **THEN** o Backlog mostra "A" e "B", nessa ordem

#### Scenario: Card criado sem descrição

- **WHEN** o usuário cria o card "Configurar CI" sem descrição
- **THEN** o card "Configurar CI" aparece no Backlog com a descrição vazia

#### Scenario: Título em branco é rejeitado

- **WHEN** o usuário tenta criar um card com o título vazio ou só com espaços
- **THEN** o sistema rejeita com uma mensagem de validação
- **AND** nenhum card é criado

#### Scenario: Título ou descrição longos demais são rejeitados

- **WHEN** o usuário tenta criar um card com título de 121 caracteres ou descrição de 5.001 caracteres
- **THEN** o sistema rejeita com uma mensagem de validação
- **AND** nenhum card é criado

### Requirement: Editar card

O sistema SHALL permitir alterar o título e a descrição de um card, com as mesmas regras da criação, sem mudar a coluna nem a posição do card.

#### Scenario: Card editado

- **GIVEN** o card "A" está na 2ª posição de Propose
- **WHEN** o usuário muda o título para "A revisado" e a descrição para "detalhes"
- **THEN** o card mostra "A revisado" e "detalhes"
- **AND** continua na 2ª posição de Propose

#### Scenario: Edição inválida mantém o card como estava

- **GIVEN** existe o card "A"
- **WHEN** o usuário tenta salvar o card com o título em branco
- **THEN** o sistema rejeita com uma mensagem de validação
- **AND** o card continua com o título "A"

### Requirement: Excluir card

O sistema SHALL permitir excluir um card somente após confirmação explícita do usuário. Os demais cards da coluna SHALL manter sua ordem relativa.

#### Scenario: Exclusão confirmada

- **GIVEN** Propose tem os cards "A", "B" e "C"
- **WHEN** o usuário pede para excluir "B" e confirma
- **THEN** Propose mostra "A" e "C", nessa ordem

#### Scenario: Exclusão cancelada

- **GIVEN** Propose tem os cards "A", "B" e "C"
- **WHEN** o usuário pede para excluir "B" e cancela a confirmação
- **THEN** Propose continua mostrando "A", "B" e "C"

### Requirement: Mover card entre colunas

O sistema SHALL permitir mover um card para qualquer coluna, numa posição escolhida, inclusive para voltar ou pular etapas. Os demais cards das colunas de origem e de destino SHALL manter sua ordem relativa.

#### Scenario: Avançar para a próxima etapa numa posição escolhida

- **GIVEN** o Backlog tem "A" e "B" e Explore tem "X"
- **WHEN** o usuário move "A" para Explore, na posição logo abaixo de "X"
- **THEN** o Backlog mostra "B"
- **AND** Explore mostra "X" e "A", nessa ordem

#### Scenario: Pular etapas

- **GIVEN** o card "A" está no Backlog
- **WHEN** o usuário move "A" para Propose
- **THEN** "A" aparece em Propose e deixa de aparecer no Backlog

#### Scenario: Voltar uma etapa

- **GIVEN** o card "A" está em Apply
- **WHEN** o usuário move "A" para Propose
- **THEN** "A" aparece em Propose e deixa de aparecer em Apply

#### Scenario: Posição além do fim da coluna

- **GIVEN** Apply tem 2 cards
- **WHEN** um movimento pede para colocar o card "A" na posição 10 de Apply
- **THEN** "A" fica no fim de Apply, como 3º card

#### Scenario: Coluna ou posição inválida

- **WHEN** um movimento indica uma coluna fora das cinco do quadro ou uma posição negativa
- **THEN** o sistema rejeita com uma mensagem de validação
- **AND** o card continua na coluna e na posição em que estava

### Requirement: Reordenar card na mesma coluna

O sistema SHALL permitir mudar a posição de um card dentro da própria coluna, mantendo a ordem relativa entre os demais cards da coluna.

#### Scenario: Card sobe para o topo

- **GIVEN** o Backlog tem "A", "B" e "C"
- **WHEN** o usuário move "C" para a 1ª posição do Backlog
- **THEN** o Backlog mostra "C", "A" e "B"

#### Scenario: Card desce para o fim

- **GIVEN** o Backlog tem "A", "B" e "C"
- **WHEN** o usuário move "A" para a última posição do Backlog
- **THEN** o Backlog mostra "B", "C" e "A"

### Requirement: Arrastar e soltar

A interface SHALL permitir mover e reordenar cards arrastando-os com o mouse ou o toque e soltando-os na coluna e na posição desejadas, sem recarregar a página.

#### Scenario: Arrastar para outra coluna

- **GIVEN** o Backlog tem "A" e Explore tem "X"
- **WHEN** o usuário arrasta "A" e solta em Explore, abaixo de "X"
- **THEN** Explore mostra "X" e "A", nessa ordem, sem recarregar a página

#### Scenario: Arrastar dentro da mesma coluna

- **GIVEN** o Backlog tem "A", "B" e "C"
- **WHEN** o usuário arrasta "C" e solta acima de "A"
- **THEN** o Backlog mostra "C", "A" e "B"

### Requirement: Mover sem arrastar

A interface SHALL oferecer em cada card a ação "Mover para", operável só pelo teclado, que lista as outras quatro colunas e move o card para o fim da coluna escolhida.

#### Scenario: Mover pelo teclado

- **GIVEN** o card "A" está no Backlog e Apply tem 1 card
- **WHEN** o usuário, só com o teclado, abre "Mover para" no card "A" e escolhe Apply
- **THEN** "A" aparece como 2º card de Apply

#### Scenario: Coluna atual não aparece como destino

- **GIVEN** o card "A" está em Explore
- **WHEN** o usuário abre "Mover para" no card "A"
- **THEN** as opções são Backlog, Propose, Apply e Archive

### Requirement: Organização persistida

O sistema SHALL persistir a coluna e a posição de cada card, de modo que o quadro mostre a mesma organização ao recarregar a página ou ao abri-lo em outro navegador.

#### Scenario: Recarregar a página

- **GIVEN** o usuário moveu o card "A" para a 1ª posição de Apply
- **WHEN** recarrega a página do quadro
- **THEN** "A" continua na 1ª posição de Apply

### Requirement: Falha ao salvar um movimento

Quando um movimento não puder ser salvo, a interface SHALL devolver o card à coluna e à posição anteriores e exibir uma mensagem de erro.

#### Scenario: Servidor indisponível durante o movimento

- **GIVEN** o card "A" está na 1ª posição do Backlog e o servidor está indisponível
- **WHEN** o usuário move "A" para Apply
- **THEN** "A" volta para a 1ª posição do Backlog
- **AND** a interface mostra a mensagem "Não foi possível mover o card. Tente de novo."

### Requirement: Card pertence a um único projeto

O quadro de um projeto SHALL mostrar apenas os cards desse projeto. Qualquer operação que referencie um card por meio de outro projeto SHALL responder "não encontrado" sem alterar dados.

#### Scenario: Quadros separados por projeto

- **GIVEN** o projeto "kanban" tem o card "A" e o projeto "site" tem o card "B"
- **WHEN** o usuário abre o quadro de "kanban"
- **THEN** vê o card "A"
- **AND** não vê o card "B"

#### Scenario: Card acessado pelo projeto errado

- **GIVEN** o card "A" pertence ao projeto "kanban"
- **WHEN** uma requisição tenta editar, mover ou excluir "A" informando o projeto "site"
- **THEN** o sistema responde "não encontrado"
- **AND** o card "A" continua inalterado
