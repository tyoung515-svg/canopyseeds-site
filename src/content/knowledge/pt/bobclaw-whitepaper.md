---
title: "BoBClaw: Um Substrato de Agentes Soberano e Harness-First"
description: "O whitepaper técnico. Como o BoB entrega execução de longo horizonte frontier-class e raciocínio verificável em modelos comuns que você possui."
category: "Papers"
format: "Write-up"
date: 2026-06-30
order: 1
---

## Resumo

A forma dominante de usar muitos modelos de linguagem hoje é a *agregação*: um único endpoint que roteia uma requisição para qualquer modelo que você indicar. Isso já virou commodity. Resolve o "um só lugar para tudo" e nada mais, e não oferece proteção alguma quando o único modelo do qual o seu fluxo de trabalho depende é descontinuado, reprecificado ou, como aconteceu em **12 de junho de 2026**, removido por determinação governamental.

O BoBClaw é a camada acima da agregação. É um substrato de agentes harness-first construído sobre uma única tese: **confiabilidade e capacidade pertencem ao scaffold, não ao modelo.** Trate o modelo como uma CPU intercambiável; coloque o valor diferenciado, verificação, orquestração, memória e governança, no harness ao seu redor. Feito corretamente, uma frota de modelos comuns e de pesos abertos, devidamente orquestrada e verificada de forma adversarial, entrega as duas coisas que realmente importam para o trabalho agêntico, **execução de longo horizonte** e **raciocínio verificável, de nível de segurança**, por uma fração do custo frontier, sem lock-in de fornecedor e sem nada que possa ser proibido por controle de exportação.

Isto não é um documento de posicionamento. O substrato aqui descrito em grande parte construiu a si mesmo: ao longo de *quatro* execuções de engenharia autônomas e de várias horas, produziu 789 novos testes com zero regressões, em inferência comum, por dígitos únicos de dólares cada. Sua espinha de verificação, um harness de honestidade real e livre de modelo, capturou toda afirmação falsa plantada de forma adversarial no conjunto plantado da execução ao vivo, e uma revisão adversarial dirigida capturou um caminho real de execução remota de código em nível de host antes do merge. A arquitetura é o argumento.

---

## 0. O Momento: capacidade que você aluga é capacidade que pode ser revogada

Em **9 de junho de 2026**, a Anthropic lançou o Fable 5 e o Mythos 5, seus modelos mais capazes até então. Três dias depois, em **12 de junho às 17h21 ET**, o governo dos EUA emitiu uma diretiva de controle de exportação exigindo que a Anthropic suspendesse o acesso de *qualquer cidadão estrangeiro, dentro ou fora dos Estados Unidos*, incluindo os próprios funcionários estrangeiros da Anthropic. A conformidade não podia ser feita de forma seletiva, então os modelos ficaram no escuro **para todos os clientes**. A preocupação declarada: um jailbreak que poderia expor a capacidade do Fable 5 de **identificar e explorar vulnerabilidades de software de forma autônoma**.

Reflita sobre o formato desse evento:

- **A capacidade banida é a capacidade agêntica.** O Fable não foi restringido por escrever redações. Foi restringido porque era *capaz demais em trabalho de segurança autônomo e de longo horizonte*, exatamente a classe de capacidade que define um agente sério.
- **Pagar não protegeu você.** Assinantes Max e Enterprise perderam o acesso da noite para o dia. Aluguel não é propriedade.
- **A geografia decide.** Quando o acesso retornou parcialmente, retornou para cerca de 100 instituições dos EUA. Se você está fora desse círculo, um cidadão estrangeiro, uma empresa não americana, um desenvolvedor em Bangkok, os modelos mais capazes são, por política, não seus para usar.

Isso já não é um risco hipotético a ser mitigado. É um modo de falha demonstrado de construir seu agente sobre um único modelo frontier alugado. A pergunta que todo construtor sério agora precisa responder é: **o que é o seu agente no dia em que o modelo por trás dele é banido, descontinuado ou colocado fora de alcance por preço?**

A resposta de um agregador é "roteie para um modelo diferente", mas se o seu fluxo de trabalho *dependia de capacidade da classe do Fable*, rotear para um modelo mais fraco é degradação, não continuidade. A resposta do BoBClaw é diferente, e é o tema deste paper: **a capacidade nunca residiu em um único modelo, para começar.**

---

## 1. Agregação é o mínimo; o produto é a camada acima

Um agregador de modelos dá a você uma API para muitos modelos. Isso é genuinamente útil e genuinamente commoditizado, o OpenRouter, o LiteLLM e uma dúzia de outros fazem isso. É o "mini castelo": um só lugar para tudo. Não torna um modelo fraco em forte, não realiza trabalho de múltiplos passos por conta própria e não torna você soberano, apenas intermedia o acesso.

O BoBClaw é a camada acima. Seu valor é tudo o que vem *depois* do "um só lugar para tudo", e repousa sobre três adições:

1. **A verificação torna modelos baratos confiáveis.** A saída de um modelo comum vale apenas tanto quanto a sua capacidade de saber quando ela está errada. O BoBClaw trata toda afirmação consequente e toda ação como uma hipótese a ser *verificada de forma adversarial por uma família de modelo diferente* antes que possa se sustentar (§4). É isso que converte "barato mas não confiável" em "barato e confiável".
2. **A orquestração realiza trabalho de verdade.** Uma única chamada roteada responde a uma pergunta. Uma frota, um planejador apex, gerentes, workers e críticos, coordenada sobre um ledger durável, completa um *projeto*: decompor, distribuir, construir, testar, reparar, verificar, mesclar (§3, §5).
3. **A disciplina de classe de capacidade a torna soberana.** Nenhum backend é nomeado na lógica. Os papéis solicitam *classes de capacidade* com cadeias de fallback. Bana um modelo, perca uma chave ou veja um pico de preço, e a classe se re-resolve para o próximo provedor, local se necessário. O sistema sobrevive à perda de qualquer fornecedor individual, inclusive aquele que o orquestra (§9).

### A tese harness-first

O enquadramento convencional trata o modelo como o produto e o código ao redor como cola. O BoBClaw inverte isso: **o harness é o produto; o modelo é uma CPU intercambiável.** Confiabilidade, autonomia, memória e governança são propriedades do scaffold, projetadas e testadas como qualquer outro sistema. O modelo fornece inteligência bruta; o harness fornece tudo o que torna essa inteligência *confiável e possuível*.

A consequência é a afirmação central deste paper: **você não precisa possuir um modelo frontier para obter resultados agênticos frontier-class. Você precisa possuir o harness.**

> **Escopo honesto.** Não afirmamos que os modelos subjacentes do BoBClaw igualem a inteligência bruta do Fable 5 em um benchmark comparável, e este paper não faz tal medição. A afirmação é mais estreita e defensável: os *resultados que importam para o trabalho agêntico*, execução sustentada de múltiplos passos e revisão verificável de nível de segurança, são reprodutivelmente alcançáveis por meio de orquestração e verificação em modelos que não estão, e não podem estar, sob controle de exportação.

---

## 2. Visão geral do sistema

O BoBClaw são quatro serviços cooperantes mais um pequeno conjunto de daemons de apoio.

| Serviço | Papel | Porta padrão |
|---|---|---|
| **core** | O motor de orquestração. Um grafo de agentes compilado: roteamento, dispatch, a topologia worker/manager/critic, backends de modelo, a espinha de verificação, memória, orçamento e o ledger durável. | 7825 |
| **gateway** | API REST + WebSocket e UI web. Autenticação JWT/TOTP, conversas, projetos, aprovações, teams, visão de roteamento, inspeção de memória. | 7826 |
| **claude-pipeline** | Um wrapper fino invocado como subprocesso para tiers de planejamento orientados por CLI. | (subprocesso) |
| **app** | Um cliente desktop Kotlin Multiplatform, o driver diário: chat em streaming, histórico de conversas, um canvas de artefatos, a visão de roteamento/JOAT e um construtor de teams. | (nativo) |

Daemons de apoio (todos opcionais, todos intercambiáveis): **Postgres** (estado de produção; SQLite no caminho quente), **Qdrant** (vetores), **Redis** (pins de throttle e um cache de saúde de TTL curto) e **hosts de modelo locais** (`llama.cpp` / Ollama / LM Studio) para embeddings, extração e inferência on-device.

Tudo o que é substantivo acontece dentro do **grafo compilado do core**: um turno de usuário entra, é roteado para uma face/backend, despachado, opcionalmente distribuído por uma frota, verificado e comprometido a um ledger append-only que é a verdadeira memória do sistema. As seções restantes percorrem as partes desse grafo que constituem a "camada acima da agregação".

---

## 3. Orquestração de frota: papéis, teams e descorrelação

A agregação roteia uma *chamada*. O BoBClaw roteia um *papel dentro de um team*.

**Papéis.** O trabalho é expresso em três papéis, **apex** (o planejador/orquestrador que decompõe uma tarefa e sintetiza resultados), **worker** (subagentes que fazem o trabalho braçal) e **critic** (auditores adversariais). Um papel é resolvido para um backend concreto por uma camada de roteamento (`core/teams.py`), não fixado em código no ponto de chamada.

**Backends.** O substrato fala com um conjunto amplo e deliberadamente heterogêneo de provedores: Qwen local via `llama.cpp`, DeepSeek V4 (o burro de carga de mão de obra barata), Kimi (coordenação de tier de plano), GLM (tier de auditoria/crítica), Gemini, a família Claude (assinatura CLI ou API), Codex, MiniMax, Ollama, LM Studio e um pool local OpenCode. Novos backends são adições locais em arquivo sob `core/backends/`; a topologia não muda quando um é adicionado ou removido.

**Teams e profiles.** Um *team* é um roster papel→backend (ex. apex=Kimi, worker=DeepSeek, critic=GLM). Um *profile* (ou "face", ~19 disponíveis) sobrepõe o **como** a um papel: system prompt, backends preferidos e de escalação, postura e limites. Os teams são autoráveis pelo usuário como YAML; os profiles são validados e versionados. É isso que permite que a mesma tarefa rode como um único worker barato, uma distribuição de dezenas ou um conselho deliberativo de múltiplos assentos, por configuração e não por código.

**Descorrelação entre famílias, o princípio de design que torna a verificação significativa.** Os backends são agrupados em *famílias* (`FAMILY_BY_BACKEND`). A regra: **um critic deve vir de uma família diferente da do ator que audita.** Um worker DeepSeek nunca é verificado por outra instância DeepSeek; é verificado por GLM ou Claude. A escalação dentro da mesma família é proibida por construção. Erros correlacionados, o modo de falha em que um modelo carimba com confiança o seu próprio tipo de erro, são eliminados por design, não deixados à sorte. Esse princípio é o que dá dentes à §4.

**Roteamento consciente de saúde.** Uma sonda de saúde ao vivo (`core/health_probe.py`, ligada na inicialização) espelha o caminho real de chamada de cada backend, faz cache dos resultados brevemente e falha aberto. Quando um backend preferido está sob throttle ou fora do ar, o roteador percorre a cadeia de escalação em vez de travar.

---

## 4. A espinha de verificação: onde o barato se torna confiável

Este é o diferencial. A maioria dos sistemas gera e então apresenta. O BoBClaw gera e então **verifica de forma adversarial contra um critic descorrelacionado**, então apresenta, e trata "não foi possível verificar" como um resultado de primeira classe e não falho, em vez de uma passagem silenciosa.

A espinha tem quatro partes, cada uma um módulo testado, usadas por *ambas* a lane de pesquisa e a lane de GUI:

- **Verificação de pós-condição descorrelacionada** (`core/verify/postcondition.py`). Depois que um passo afirma um resultado, um critic *de uma família de modelo diferente* é questionado se o resultado de fato se sustenta. Apenas um veredicto explícito `HOLDS` passa; qualquer outra coisa falha em segurança. (61 testes.)
- **Portão de entailment de afirmações** (`core/verify/entailment.py`), o motor. Toda afirmação quantitativa é modelada como um `Claim(subject, predicate, value, cited_source)`. O portão **reabre a fonte citada** e pergunta a um critic de outra família, *"esta fonte de fato sustenta este número?"*, retornando `ENTAILED` / `NOT_ENTAILED` / `UNKNOWN`. Uma afirmação que cita uma fonte que não a sustenta não chega a ser declarada. O motor é construído, testado e comprovado em execuções ponta a ponta para capturar afirmações erradas-mas-plausíveis. *Escopo honesto:* é código de biblioteca invocado onde estiver ligado, ainda não disparado automaticamente sobre toda afirmação em todo caminho de produção; e "nenhum sistema comercial entrega entailment de fonte por afirmação" é uma tese de design que acreditamos se sustentar, não um levantamento de mercado com benchmark. (52 testes.)
- **Portão de retry externalizado (ERG)** (`core/ledger/erg.py`). O estado de rejeição vive *fora* do contexto do worker. Em uma falha de entailment, a tarefa se re-ramifica com *apenas um sinal de restrição negativa*, "esta bid-key falhou; estas fontes foram tentadas", e nenhum raciocínio qualitativo, de modo que o worker não pode ser convencido a repetir o mesmo erro. Após um número limitado de tentativas, ela comita `[UNVERIFIED: EXHAUSTED_SEARCH]` e apresenta a lacuna como um **desconhecido-conhecido**. Os motivos de falha são um enum limitado (`TEMPORAL_SCOPE_MISMATCH`, `WRONG_ENTITY`, `STALE_SOURCE`), nunca texto livre.
- **Terminação com FAIL por padrão** (`core/verify/termination.py`, `core/ledger/mergegate.py`). Todo critério de conclusão começa com `verified = False`. Um resultado só é mesclado quando **todos** os critérios são verificados ou explicitamente marcados como esgotados. O conjunto vazio não passa. A conclusão é algo que você *conquista*, não o padrão.

**O resultado medido, declarado com precisão.** A métrica de honestidade é ela própria mensurável: `false_pass_rate` (`core/ses/falsepass.py`) é um harness real e livre de modelo que pontua a fração de afirmações *deliberadamente plantadas, plausíveis-mas-erradas* que um critic passa incorretamente. Na execução ao vivo ponta a ponta, um critic real de outra família produziu **zero passagens falsas no conjunto plantado**, mas esse conjunto era pequeno e escrito à mão (um punhado de itens), então a afirmação honesta é "o harness *mede* a taxa de passagem falsa e o critic pontuou limpo no conjunto plantado", não "uma taxa garantida de 0%". Endurecê-lo é um corpus plantado maior, executável por terceiros. O ponto se sustenta de qualquer forma: modelos baratos não são *confiados*, são *verificados*, por uma família diferente, com um viés de falha por padrão.

---

## 5. A lane de build: construção contract-first com um portão de verificação isolado

A lane de build é a demonstração mais clara de revisão "de nível de segurança", porque aqui o sistema executa código que um modelo escreveu.

O caminho no grafo é: `build_request → plan_contracts → dispatch → worker ×N → join → verify → {repair → verify}* → END`.

- **Contratos primeiro** (`core/nodes/build_plan.py`). Um tier de planejamento cunha contratos, assinaturas de interface e comportamento esperado, *antes* de qualquer implementação. O planejador escreve specs, não código.
- **Workers implementam** contra os contratos (backends comuns).
- **O portão de verificação executa o código escrito pelo modelo em um sandbox Docker travado** (`core/build/sandbox.py`): `--network none`, `--cap-drop ALL`, um mount de workspace somente leitura, memória/PIDs/CPU limitados, `--rm`. Foi **empiricamente demonstrado que bloqueia leituras de segredos do host e exfiltração de rede**. O portão é o *único* emissor de um veredicto de passa/falha (exatamente uma vez), ele nunca edita o teste para fazê-lo passar, e uma especificação ruim permanece *à mostra* em vez de ser silenciosamente absorvida.
- **Loops de reparo** regeneram contra o mesmo portão até ficarem verdes ou esgotarem.

**Prova, não promessa.** Em uma execução ao vivo ponta a ponta, 8 contratos produziram 8 implementações que compilaram, rodaram e passaram 8/8 testes, totalmente isoladas em sandbox. Uma subsequente revisão de código de esforço máximo e *dirigida* do branch completo **capturou um RCE real em nível de host**, uma assinatura de contrato não filtrada sendo importada no host, além de um caminho de falso-verde e uma corrupção de parsing, tudo *antes* do merge. A postura de segurança é de duas camadas, e nenhuma das camadas confia no modelo: uma *revisão adversarial dirigida* é o que **capturou** o RCE (detecção), e o sandbox Docker é o que **contém** o código escrito pelo modelo em tempo de execução (mitigação). O enquadramento honesto: o portão *assume* mau comportamento e a revisão *caça* por ele, não que o portão autônomo detectou o RCE por conta própria.

---

## 6. A lane de pesquisa: raciocínio citado, verificado por afirmação

A lane de pesquisa é um loop orquestrador-worker com reconstrução iterativa de rodadas, e é onde o portão de entailment (§4) se torna uma garantia voltada ao usuário.

- Os workers recuperam **LKS-first** (o substrato de conhecimento local, §8) antes de recorrer à web aberta, de modo que o raciocínio se fundamenta em conhecimento próprio e durável.
- Uma **disciplina de citação** vincula toda afirmação quantitativa a uma fonte, e o portão de entailment reabre essa fonte e verifica o suporte antes que a afirmação seja permitida na saída.
- A terminação é adversarial e com falha por padrão: o loop termina quando os critérios são verificados ou honestamente marcados como desconhecidos, não quando o modelo se declara pronto.

O contrato de saída é, portanto, incomumente forte: os números que sobrevivem até a página tiveram suas fontes citadas relidas por um critic descorrelacionado, e os números que não puderam ser substanciados aparecem como desconhecidos-conhecidos explícitos em vez de fabricações confiantes.

---

## 7. A lane de uso de computador via GUI: agir, depois verificar que o mundo mudou

Operar uma UI real é onde os agentes com mais frequência "têm sucesso" no papel enquanto falham na realidade. A lane de GUI do BoBClaw (`core/gui/`) aplica a mesma disciplina harness-first e de falha por padrão a pixels e árvores de acessibilidade.

O loop interno é **capture → ground → act → verify**, construído andar por andar como lógica determinística sem modelo antes que qualquer modelo seja introduzido:

- **Os frames carregam estrutura, não bytes**, um pixel-hash mais um índice de acessibilidade, permitindo diffs baratos e independentes de ordem do tipo "alguma coisa de fato mudou?" (`core/gui/framediff.py`).
- **As pós-condições são verificadas após cada ação** (`core/gui/verify.py`): uma condição vazia/não atendida falha *fechada*; condições semânticas ("o arquivo foi salvo", "a linha certa está selecionada") escalam para o critic descorrelacionado da §4.
- **Um resolvedor determinístico de tier de ação** (`core/gui/tiers.py`) classifica toda ação e ferramenta em tiers mandatórios (somente leitura / escrita local / social / acesso total). Ações de acesso total roteiam para uma interrupção humana mecânica, nenhum modelo decide que uma ação irreversível está tudo bem.
- **Um detector de travamento de cinco sinais** (`core/gui/stuck.py`), sem-progresso, repetição-de-ação, orçamento-de-passos, orçamento-de-tempo, sequência-de-veto, interrompe loops deterministicamente, sem nenhum modelo na decisão.

O padrão é consistente nas três lanes: o modelo propõe; portões determinísticos e críticos descorrelacionados dispõem; "pronto" é conquistado contra pós-condições verificadas.

---

## 8. O substrato de memória e conhecimento

Um agente sem memória durável re-deriva as mesmas conclusões para sempre. A memória do BoBClaw é projetada de modo que o raciocínio *compile uma vez e permaneça atual.*

**A arquitetura de conhecimento** (a fundação lançada no whitepaper de conhecimento v1.0, agora parte deste sistema). O conhecimento é compilado em stores estruturados e persistentes em vez de re-recuperado de documentos brutos a cada consulta; pessoas e projetos são entidades de primeira classe com contexto acumulado; e uma *hierarquia de agentes de lint*, pequenos modelos de menos de 2B para monitoramento contínuo de baixo custo, modelos de médio porte para análise substantiva, modelos frontier para reconhecimento de padrões entre sistemas, atua como um sistema imunológico que mantém a base de conhecimento coerente e permite que o agente melhore a partir de seu próprio histórico operacional.

**O módulo de memória de runtime** (`core/memory/`). Um log de eventos L0 append-only (SQLite), extração de fatos L1 em background (um pequeno modelo local), dedup baseado em fingerprint e um passo de recall que insere fatos relevantes no prompt antes do dispatch e **falha aberto**, um vetor faltante é ignorado, nunca fatal.

**Convergência sobre um único substrato durável (LKS).** Em vez de manter uma implementação de memória paralela para sempre, o BoBClaw está convergindo sua memória sobre o Local Knowledge Substrate por meio de uma ponte de leitura/escrita protegida (`core/memory/lks_adapter.py`, `write_fence.py`): uma guarda de vetor-zero, um fingerprint de embedding que carimba as coleções com versão, um adaptador de leitura e uma cerca de escrita de escritor único, consolidados sobre um único vector store.

**O ledger é o sistema de registro** (`core/ledger/`, `core/harness/`). O estado é um DAG de commits git-nativo append-only, um commit por trajetória no merge. O contexto é reconstruído *fatiando o ledger*, não confiando no que quer que reste no context window de um modelo, e notas de falha estruturadas sempre sobrevivem à compactação. Um supervisor (`core/harness/supervisor.py`) trata um subagente morto como um erro retentável ("gado, não bichos de estimação") e pode reproduzir-e-retomar a partir do ledger. Esta é a camada de durabilidade que torna a autonomia de longo horizonte (§9) possível sem um humano cuidando do contexto.

---

## 9. Soberania e economia

Tudo acima converge em duas propriedades que a agregação sozinha não pode fornecer.

### 9.1 Soberania como propriedade derivada

Como nenhum backend é nomeado na lógica, apenas papéis resolvidos para classes de capacidade com cadeias de fallback (`core/teams.py`), o **substrato entregue não tem dependência rígida de nenhum modelo ou fornecedor único**. Essa é a afirmação precisa e defensável. Aqui está exatamente o que ela significa e o que não significa:

- **O tier de mão de obra era verificavelmente frontier-free.** Em ambas as execuções autônomas (§10), o tier de build foi *CLAUDE-FREE por construção e verificado por sprint*: modelos comuns (DeepSeek, GLM, Kimi) escreveram e auditaram de forma adversarial cada linha; o modelo frontier (Opus) apenas **conduziu e gerenciou**, ele nunca escreveu código de produção. A inteligência cara não era sustentadora para a *mão de obra*.
- **Mas "comum" não é "auto-hospedável", e não vamos misturar os dois.** DeepSeek, GLM e Kimi são APIs de nuvem, não pesos abertos que você roda por conta própria; apenas os backends `local` (llama.cpp/Qwen), `opencode` e `codex` são verdadeiramente auto-hospedáveis. E as execuções *demonstradas* usaram um apex Claude para orquestração, com algumas cadeias de escalação embutidas recorrendo a `claude_api`. Um build *ponta a ponta* totalmente isolado por air-gap e frontier-free é suportado pela arquitetura mas ainda não é uma demonstração de destaque.
- **A resiliência é arquitetural, não um único caminho mágico.** Bana um modelo, perca uma chave ou veja um pico de preço, e a classe de capacidade se re-resolve para o próximo provedor, até a inferência local se a cadeia estiver configurada dessa forma. Nenhum fornecedor único é *estruturalmente* sustentador. *Essa* é a propriedade que sobrevive a uma proibição de exportação, não uma afirmação de que o BoBClaw nunca toca um modelo frontier.

É por isso que a spec que define este sistema já citava a suspensão como justificativa de design **antes deste paper ser escrito**: *"A suspensão do Fable 5 / Mythos 5 em 12 de junho de 2026 tirou um modelo implantado do ar para toda a sua base global de usuários em questão de horas por meio de uma única diretiva."* A soberania era a premissa de design; a notícia a confirmou.

### 9.2 A economia

O tier caro é orquestração e adjudicação; a mão de obra sustentadora tem preço de commodity. Medido na execução de build autônoma (§ abaixo), amortizado:

| Tier | Papel | Custo amortizado | Base |
|---|---|---|---|
| DeepSeek V4 Flash | Worker, escreveu todo o código + 294 testes | **< $1** | Custo marginal PAYG real |
| Kimi | Apex, coordenação de fan-out | **~$0,46** | ~5% de uma semana em um plano de $40/mês |
| GLM 5.2 | Critic, auditoria adversarial | **~$0,15** | ~1% de uma semana em um plano de $65/mês |
| Claude Opus | Conductor + gerentes, apenas orquestração | **~$2** | **~9% de uma semana** em um plano Max de $100/mês |
| **Total** |, | **~$3-4** | para um build autônomo de ~5 horas |

> **Correção registrada (2026-06-30):** um retrospecto anterior amortizou o tier Claude contra o plano *mensal* e reportou ~$9. A base correta é ~9% da cota de uma **semana** ≈ ~$2, cerca de 4× menor, o que reduz o total da execução de ~$10-11 para **~$3-4**. As linhas Kimi/GLM já eram semanais. *Reconciliado:* a auditoria independente classifica o total corrigido de ~$3-4 como **suportado** (a aritmética é sólida), com a ressalva de que apenas o DeepSeek é custo marginal pay-as-you-go real, Kimi, GLM e Claude são frações amortizadas de planos fixos, não cobranças medidas separadamente.

**Ressalvas honestas, declaradas com clareza:**

- **Percentual-de-plano não é dólares marginais.** Apenas o DeepSeek e a janela de tokens do Claude são medidos por uso; Kimi e GLM são frações de assinaturas fixas. Os valores amortizados ilustram "que fração do que já pago", não uma cobrança faturada separadamente.
- **O argumento é estrutural, não "grátis".** ~2,2M de tokens de orquestração é um custo real. A afirmação é que *a orquestração é o tier caro e a mão de obra tem preço de commodity*, que é exatamente a alavanca que torna uma frota econômica.

A conclusão: uma execução de engenharia autônoma de cinco horas, totalmente verificada, por alguns dólares amortizados, e o componente mais caro é o orquestrador *substituível*, não a mão de obra.

---

## 10. Evidências e limitações

### O que foi construído e medido

- **Autonomia de longo horizonte, repetida, não um caso isolado.** **Quatro** execuções autônomas completas, todas mescladas com **zero regressões**, suíte core 1908→2697 (**+789 testes** ao longo de aproximadamente 31 h): Mega-Sprint #1 (~5 h, 9/9 sprints, **+294**, 0 intervenções humanas até o portão de merge), a lane de convergência do Mega-Sprint #2 (6 sprints, **+115**, o substrato de memória LKS), a lane de uso de computador via GUI (~13 h, 10 sprints, **+229**, uma cabeça de fundamentação por visão local em uma GPU de 16GB) e a lane de pesquisa (~9 h, 8 sprints, **+151**, entailment em nível de afirmação). Cada sprint passou em sua própria verificação ao vivo ponta a ponta e em uma auditoria adversarial *conduzida até a convergência*, com toda execução de teste que toca o corpus rodada contra um clone com o corpus ao vivo assegurado como intocado. A lane de pesquisa tomou uma exceção limitada e registrada à regra de mão de obra frontier-free (um modelo frontier apenas como critic de auditoria de fallback, sobre um login de assinatura, nunca a API medida; o tier de autoria permaneceu comum). O padrão se reproduz.
- **Raciocínio verificável.** Um harness `false_pass_rate` real e livre de modelo; o critic de outra família pontuou zero passagens falsas no conjunto plantado (pequeno) na execução ao vivo (§4), medido, não garantido.
- **Revisão de nível de segurança.** Um sandbox Docker isolado de rede e com capabilities removidas que demonstravelmente bloqueia leituras de segredos do host e egresso de rede (mitigação), além de uma revisão adversarial dirigida que capturou um RCE real em nível de host antes do merge (detecção) (§5).
- **Economia soberana.** ~$3-4 amortizados para uma execução de ~5 horas; a mão de obra de build rodou frontier-free em modelos comuns, com o modelo frontier usado apenas para orquestração (§9).

### Limitações e escopo honesto

- **Sem benchmark frontier.** Este paper não mede os modelos do BoBClaw contra o Fable 5 diretamente. A afirmação defensável é *autonomia* e *verificabilidade* demonstradas, não paridade de modelo com benchmark (§1).
- **A soberania é arquitetural, ainda não demonstrada com air-gap.** O código entregue não tem dependência rígida de frontier e o tier de mão de obra rodou frontier-free, mas uma execução *ponta a ponta* totalmente auto-hospedada e frontier-free (apenas pesos abertos, sem APIs de commodity em nuvem, sem apex Claude) ainda não foi realizada como demo de destaque (§9.1).
- **Algumas lanes são projetadas à frente do build.** A espinha de verificação, o pipeline de build e a convergência de memória (LKS↔BoB) estão construídos e na linha principal; as lanes de GUI e pesquisa são andares determinísticos com costuras apoiadas em modelo ainda sendo produtizadas, e a cabeça de fundamentação ao vivo da lane de GUI está atualmente *bloqueada por um asset de modelo local* (Holo3-35B ainda não em disco), uma dependência que o sistema expôs em vez de falsificar. O paper distingue "construído e medido" de "projetado" o tempo todo.
- **A medição de orçamento é aproximada** na execução citada; o threading real de `usage` do provedor é um trabalho subsequente.
- **O custo de verificação é real.** Críticos descorrelacionados e verificações de entailment adicionam chamadas. A economia da §9 é *líquida* dessa sobrecarga, que é o ponto, mas é sobrecarga, não mágica.

### Reprodutibilidade

O substrato é inspecionável. Toda afirmação neste paper mapeia para um módulo, uma contagem de testes ou um registro de execução no repositório BoBClaw, a espinha de verificação (`core/verify/`, `core/ses/`), o sandbox de build (`core/build/`), o ledger (`core/ledger/`) e os documentos de retrospecto e resultados sob `tasks/`. A auditoria de ledger de afirmações que acompanha este paper registra cada número sustentador contra sua fonte.

---

## 11. Conclusão

A semana em que um modelo frontier foi tirado do ar por determinação governamental é a semana em que a suposição central da indústria, *alugue o melhor modelo e construa em cima dele*, deixou de ser segura. O acesso é condicional. A geografia é decisiva. Capacidade que você não possui pode ser retirada entre uma terça e uma sexta-feira.

O BoBClaw é uma aposta de que a coisa durável a possuir não é um modelo mas um **harness**: um substrato que torna modelos comuns confiáveis por meio de verificação descorrelacionada, produtivos por meio de orquestração e seus por meio de soberania de classe de capacidade. A agregação dá a você uma chave para o castelo de outra pessoa. O BoBClaw é a camada acima, aquela que continua funcionando quando a chave é revogada.

---

*Rascunho v0.95, afirmações sustentadoras reconciliadas contra a auditoria independente de ledger de afirmações (`audits/claims-ledger-v1.md`). Documento companheiro: a história de construção "How BoB Built BoB" (a execução de dogfooding, em forma narrativa).*
