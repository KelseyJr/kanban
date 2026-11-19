# Spec Delta

## Purpose

Leva cada mudança do repositório até a produção por um pipeline automático: o pull request só passa com as imagens construídas e testadas, e a `main` publica e implanta exatamente as imagens que passaram nos testes.

## ADDED Requirements

### Requirement: Verificação de pull request

Todo pull request SHALL disparar o pipeline, que roda o typecheck e os testes unitários do backend e do frontend, constrói a imagem de cada app e roda a suíte E2E contra uma stack montada com essas imagens. O resultado SHALL aparecer no pull request.

#### Scenario: Pull request com tudo passando

- **WHEN** um pull request tem o typecheck, os testes unitários, o build das imagens e o E2E passando
- **THEN** o pipeline aparece como aprovado no pull request

#### Scenario: Teste unitário falhando

- **WHEN** um teste unitário do backend ou do frontend falha no pull request
- **THEN** o pipeline aparece como reprovado no pull request

#### Scenario: Imagem que não constrói

- **WHEN** o build da imagem de um dos apps falha
- **THEN** o pipeline aparece como reprovado
- **AND** o E2E não roda

#### Scenario: E2E falhando contra as imagens

- **WHEN** um spec E2E falha contra a stack montada com as imagens do pull request
- **THEN** o pipeline aparece como reprovado no pull request

### Requirement: Pull request não publica nada

O pipeline de um pull request SHALL NOT publicar imagens, obter credenciais da nuvem nem alterar o ambiente de produção, mesmo quando todas as verificações passam.

#### Scenario: Pull request aprovado

- **WHEN** o pipeline de um pull request termina aprovado
- **THEN** nenhuma imagem nova existe no registry
- **AND** a produção continua servindo a mesma versão de antes

### Requirement: Mesmas verificações na main

Todo push na branch `main` SHALL rodar as mesmas verificações de um pull request antes de publicar qualquer coisa. Se alguma falhar, nada é publicado nem implantado.

#### Scenario: Push na main com teste falhando

- **WHEN** um commit com um teste falhando chega à `main`, por merge ou por push direto
- **THEN** o pipeline fica reprovado
- **AND** nenhuma imagem é publicada e a produção não muda

### Requirement: Publicação das imagens testadas

Depois que as verificações passam na `main`, o pipeline SHALL publicar no registry exatamente as imagens que passaram no E2E, identificadas pelo commit. Uma imagem publicada para um commit SHALL NOT ser sobrescrita.

#### Scenario: Imagens publicadas após as verificações

- **WHEN** as verificações de um commit da `main` passam
- **THEN** o registry passa a ter as imagens do backend e do frontend identificadas por esse commit
- **AND** o conteúdo de cada imagem é o mesmo da imagem que passou no E2E

#### Scenario: Nova execução para o mesmo commit

- **WHEN** o pipeline roda de novo para um commit cujas imagens já estão no registry
- **THEN** as imagens já publicadas são mantidas, sem sobrescrita

### Requirement: Deploy automático

Depois de publicar as imagens, o pipeline SHALL implantar em produção as imagens do commit e só SHALL terminar aprovado quando a produção responder saudável e com o acesso protegido ativo.

#### Scenario: Deploy bem-sucedido

- **WHEN** as imagens de um commit da `main` são publicadas
- **THEN** a produção passa a servir as imagens desse commit
- **AND** o pipeline confirma que a verificação de saúde pública responde com sucesso e que a página do app pede credenciais

#### Scenario: Verificação pós-deploy falha

- **WHEN** a verificação de saúde pública não responde com sucesso depois do deploy
- **THEN** o pipeline fica reprovado

### Requirement: Volta automática para a versão anterior

Se a nova versão não ficar saudável dentro do tempo limite, a produção SHALL voltar a servir a versão anterior e o pipeline SHALL ficar reprovado. No primeiro deploy, sem versão anterior, o pipeline só fica reprovado.

#### Scenario: Nova versão não sobe

- **WHEN** o backend da nova versão não fica saudável dentro do tempo limite
- **THEN** a produção volta a servir as imagens da versão anterior
- **AND** o pipeline fica reprovado

#### Scenario: Primeiro deploy falha

- **WHEN** o primeiro deploy do ambiente não fica saudável
- **THEN** o pipeline fica reprovado, sem versão anterior para restaurar

### Requirement: Deploys em fila

Execuções do pipeline na `main` SHALL rodar uma de cada vez, sem cancelar a que está em andamento. Enquanto uma roda, só o push mais recente fica na fila, para a produção nunca voltar a um commit mais antigo do que o que já está no ar.

#### Scenario: Dois pushes seguidos

- **WHEN** o commit B chega à `main` enquanto o pipeline do commit A ainda roda
- **THEN** o pipeline de B espera o de A terminar
- **AND** ao final a produção serve o commit B

#### Scenario: Fila substituída por push mais novo

- **WHEN** os commits B e C chegam à `main` enquanto o pipeline de A roda
- **THEN** o pipeline de B é descartado e o de C roda depois do de A
- **AND** ao final a produção serve o commit C

### Requirement: Acesso à nuvem sem chave de longa duração

O pipeline SHALL acessar a nuvem com credenciais temporárias emitidas para cada execução e aceitas só para execuções da `main`. O repositório SHALL NOT guardar chaves de acesso da nuvem.

#### Scenario: Execução fora da main

- **WHEN** uma execução que não é da `main` tenta obter credenciais da nuvem
- **THEN** a nuvem recusa as credenciais

### Requirement: Deploy desligado sem produção configurada

Quando o operador desliga o deploy (por exemplo, depois de destruir a infra), o pipeline da `main` SHALL rodar só as verificações e SHALL informar no resumo da execução que a publicação e o deploy foram pulados, sem ficar reprovado por isso.

#### Scenario: Push na main com o deploy desligado

- **WHEN** um commit chega à `main` com o deploy desligado e as verificações passando
- **THEN** o pipeline fica aprovado sem publicar imagens nem implantar
- **AND** o resumo da execução informa que a publicação e o deploy foram pulados

### Requirement: Reimplantar uma versão anterior

O operador SHALL poder reimplantar as imagens de um commit anterior da `main`, ainda guardadas no registry, sem reconstruí-las.

#### Scenario: Rollback manual

- **WHEN** o operador executa de novo o deploy da execução de um commit anterior da `main`
- **THEN** a produção passa a servir as imagens daquele commit, tiradas do registry
