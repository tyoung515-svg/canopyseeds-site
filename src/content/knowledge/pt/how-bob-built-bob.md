---
title: "Como o BoB Construiu o BoB"
description: "Uma história de construção. Quanto custa, e o que significa, quando uma frota de modelos comuns, verificada e orquestrada, entrega código de produção ao longo de quatro execuções sem supervisão."
category: "Papers"
format: "Write-up"
date: 2026-06-30
order: 2
---

## A semana em que a premissa desmoronou

Em 12 de junho de 2026, uma única diretiva governamental tirou o melhor modelo da Anthropic do ar para toda a sua base global de usuários em questão de horas. Não foi limitado, *sumiu*. Estrangeiros bloqueados, clientes corporativos pagantes incluídos, porque a conformidade não podia ser feita de forma seletiva. O modelo voltou, com o tempo, liberado para cerca de cem instituições dos EUA. Se você não estivesse entre elas, a fronteira simplesmente deixou de ser sua.

Eu vinha construindo em direção a uma aposta diferente havia meses, e aquela semana a tornou concreta. A aposta é esta: **o que vale a pena possuir de forma duradoura não é um modelo, é o arcabouço em volta dele.** Se a inteligência que você aluga pode ser revogada entre uma terça e uma sexta-feira, então a parte que vale construir é o andaime que torna a inteligência *comum* confiável o bastante para fazer trabalho de verdade, e portátil o bastante para que nenhum fornecedor sozinho possa desligá-la.

A maneira honesta de testar essa aposta era apontá-la para o alvo mais difícil e menos indulgente que eu tinha: ela mesma. Poderia uma frota de modelos baratos, devidamente orquestrada e verificada de forma adversarial, construir o próprio sistema que os orquestra e verifica, sem mim no circuito?

Foi isto que aconteceu quando tentei.

---

## De um mini castelo à camada acima

O BoBClaw não começou como BoBClaw. Começou como Canopy Seed, um agente que transformava uma ideia em linguagem simples em software funcional e testado. "Plante uma ideia, entregue software que funciona." Funcionava. Era, a seu modo, um mini castelo: um único lugar que fazia tudo, *um lugar só para todos os seus modelos*.

O problema de um-lugar-para-tudo é que isso agora é commodity. Uma dúzia de serviços encaminha um prompt para o modelo que você indicar. Agregação é o mínimo esperado. O que ela não faz é tornar um modelo barato *confiável*, nem levar um *projeto* de vários passos até o fim por conta própria, nem sobreviver ao dia em que seu modelo favorito desaparece.

O BoB é a camada acima daquele castelo. Mesma linhagem, afirmação maior: não "acesso a todos os modelos", mas **confiabilidade, autonomia e soberania construídas sobre os modelos mais baratos capazes de fazer o serviço.** A forma de provar uma afirmação dessas não é um gráfico de benchmark. É fazer a coisa construir a si mesma e mostrar os comprovantes.

---

## A máquina

A configuração é deliberadamente sem graça, porque sem graça é o que sobrevive a horas de execução sem supervisão.

- Um **conductor** (um modelo de fronteira, Opus) lê um quadro de sprints e suas dependências, e decide o que lançar em seguida. Ele nunca escreve código de produção. Ele conduz.
- Para cada sprint ele lança um **manager**, que é dono de uma unidade de trabalho de ponta a ponta: entrega o contrato aos workers, coleta o resultado, roda os testes, conduz uma auditoria adversarial até a convergência, e ou devolve um sprint verde e commitado, ou *para e faz uma pergunta*.
- Os **workers** são modelos comuns, DeepSeek para o grosso da autoria, GLM como crítico adversarial, Kimi para coordenação. Eles escrevem o código e os testes. Eles discutem entre si sobre se o código está certo.

Três regras tornaram seguro dar as costas:

1. **A camada de build é frontier-free.** Modelos comuns escrevem e auditam cada linha; o modelo de fronteira apenas conduz e gerencia. (Isso não é aspiração, é afirmado e verificado em cada sprint. Mais sobre por que isso importa, e sobre a única exceção delimitada, no fim.)
2. **Nada faz merge de si mesmo.** Os workers commitam em um branch de lane; o manager roda a suíte completa de testes mais uma verificação ao vivo de ponta a ponta em um branch de integração; então ele para. O merge para o `main` é meu, sempre.
3. **Não toque no que não é seu.** Qualquer teste que leia um corpus de conhecimento ao vivo roda contra um *clone*, e verifica depois que o corpus real, seu git HEAD, seus timestamps de arquivo, nunca se moveram.

E uma regra que acabou importando mais do que qualquer uma delas: **"pronto" tem de ser conquistado.** Todo critério de conclusão começa como `False`. Um sprint só faz merge quando todo critério é verificado, ou honestamente marcado como "não foi possível verificar". O conjunto vazio não passa. Um agente que se declara concluído não é o mesmo que um agente que *está* concluído, e o arcabouço sabe a diferença.

---

## A primeira execução

Eu a iniciei, vi o primeiro sprint ser lançado, e então fui fazer outra coisa por cinco horas.

Quando voltei: **nove de nove sprints terminais. Zero intervenções humanas.** A suíte de testes tinha ido de 1.908 para 2.202, **294 novos testes, zero regressões.** Cada sprint tinha passado por sua própria maratona: os workers escreviam o código, um crítico de família diferente tentava despedaçá-lo, e o manager repetia essa auditoria *até convergir*, não "três rodadas e envia", mas rodadas até o crítico ficar sem objeções reais. Alguns sprints convergiram em três rodadas. Alguns levaram oito. Cada achado rejeitado foi ou corrigido com um teste de regressão, ou recusado com uma justificativa de uma linha. Nenhuma aprovação silenciosa.

O que aquela primeira execução construiu foi a espinha de tudo o que veio depois: a camada de verificação que confere uma afirmação contra uma família diferente de modelo, a camada de medição que pontua a própria honestidade do sistema, o governor de orçamento, a durabilidade recuperável a falhas. O andaime que permitiria às execuções seguintes irem mais longe e mais fundo.

A parte à qual eu sempre volto é a espinha de verificação se pegando a si mesma. O sistema mede a própria honestidade: você planta afirmações erradas-mas-plausíveis e vê quantas um crítico deixa passar. No conjunto plantado da execução, um crítico real de outra família deixou passar *nenhuma*. Quero ser preciso, porque precisão é o objetivo inteiro deste projeto: esse conjunto plantado era pequeno e feito à mão, o arcabouço *mede* a taxa de falso-positivo, ele não *garante* um número, e fortalecê-lo em um corpus grande, executável por terceiros, está na lista. Mas o formato é o que importa. Os modelos baratos nunca foram confiados. Eles foram *conferidos*, por uma família diferente, com um viés a favor da falha. É isso que faz de "usamos modelos baratos" uma vantagem em vez de uma confissão.

---

## Os comprovantes

Eis o que cinco horas autônomas custaram, honestamente, e com a correção que importa:

| Camada | Função | Custo |
|---|---|---|
| DeepSeek | Escreveu todo o código e todos os 294 testes | **menos de $1** (pagamento por uso de verdade) |
| Kimi | Coordenou o fan-out | **~$0,46** (cerca de 5% de uma semana de um plano de $40/mês) |
| GLM | Auditou tudo de forma adversarial | **~$0,15** (cerca de 1% de uma semana de um plano de $65/mês) |
| Opus | Conduziu e gerenciou, nenhum código de produção | **~$2** (cerca de 9% de uma semana de um plano de $100/mês) |
| | **Total** | **alguns dólares** |

A correção: um write-up anterior amortizou a camada Opus contra o plano *mensal* e reportou cerca de $9, o que fez a execução parecer custar de $10 a $11. Foram 9% da franquia de uma *semana*, não de um mês, cerca de quatro vezes menos. O número real é alguns dólares.

As ressalvas honestas, porque são estruturais: só o DeepSeek é um custo real medido, por uso. Kimi, GLM e Opus são frações de planos fixos que eu já pago, então alguns dólares é "que fração do que eu já gasto isto consumiu", não uma linha em uma fatura. E cerca de 2 milhões de tokens de orquestração não são de graça; são apenas baratos, e, este é o ponto, são a parte *substituível*. A camada cara é o conductor. A mão de obra tem preço de commodity. A confiabilidade mora no arcabouço, não no modelo. As execuções mais longas que se seguiram gastaram mais em orquestração, mais horas, mais condução, mas o formato da conta nunca mudou: a camada fina de direção custa o dinheiro, a mão de obra continua barata.

---

## Reproduziu, mais três vezes

Uma única execução de cinco horas é uma ótima demonstração e um argumento fraco. O que a transforma em tese é ter acontecido de novo. Mais três vezes, cada uma mais longa ou mais difícil do que uma prova de conceito tem qualquer direito de ser, cada uma com merge para o `main`.

**A execução de memória (cerca de quatro horas e meia, 115 testes a mais).** A execução seguinte encarou o encanamento mais perigoso do sistema: dar ao BoB uma única memória durável sem deixá-lo corromper a memória de onde ele lê. Seis sprints ligaram o BoB para ler de um corpus de conhecimento ao vivo enquanto escreve apenas na sua própria coleção cercada, por trás de guardas que fecham um bug específico de corrupção que tinha mordido uma versão anterior. Todo teste que tocava o corpus rodava contra um clone, e verificava depois que a coisa real, seu git HEAD e todo timestamp de arquivo, não havia se movido. Zero regressões. Merge feito.

**A execução de uso de computador (cerca de treze horas, 229 testes a mais).** A execução mais longa de longe, e a que tinha um verdadeiro desconhecido no centro: poderia o BoB *dirigir uma tela* com segurança, e poderia o modelo de visão que ancora o "clique aqui" rodar no meu próprio hardware em vez de uma API na nuvem? Dez sprints construíram um loop com portões de segurança que olha uma tela, decide uma ação, e a verifica, com um portão determinístico que tem de passar antes de qualquer clique ao vivo. O desconhecido se resolveu do jeito certo: um modelo de visão rodando localmente na minha própria GPU ancorou alvos de tela dentro de dezesseis pixels sempre, e a verificação de falsa-ação foi de um cara-ou-coroa quando perguntada de forma ingênua para zero falso-positivos quando reancora e compara. Esta é a execução que eu apontaria a um cético, porque construiu a capacidade mais arriscada do sistema, em um modelo auto-hospedado, e os portões de segurança seguraram por treze horas sem supervisão.

**A execução de pesquisa (cerca de nove horas, 151 testes a mais), e o único asterisco honesto.** A última execução construiu a lane de pesquisa profunda, a parte cuja vantagem sobre uma ferramenta de pesquisa comum é que ela verifica uma afirmação no nível da *implicação lógica*, não do "existe uma citação". Ela mediu uma taxa de falso-positivo de zero em afirmações plantadas erradas-mas-plausíveis: entregue a ela uma fonte que diz 77,8 enquanto a afirmação diz 80,4, e ela marca a afirmação como não verificada em vez de deixar a citação passar. Sua própria auditoria pegou bugs genuínos de falsa-garantia que um portão inferior teria enviado, um passo que marcava sua entrada nunca-conferida como verificada, um merge que engoliu um revert falho.

E eis o asterisco, porque omiti-lo faria deste documento uma mentira: **esta execução não foi totalmente frontier-free.** Dois dos críticos baratos ficaram estourando o tempo limite nas maiores cargas de revisão, então a camada de auditoria teve permissão para um recuo delimitado e registrado a um crítico de fronteira, e apenas como um *crítico de auditoria de recuo*, apenas sobre o login de assinatura que eu já pago, nunca a API medida. Os workers que escreveram o código e os testes permaneceram em modelos comuns, e o conductor ainda apenas conduzia. É uma flexibilização real da regra um, está escrita em todo lugar em que aconteceu, e é exatamente o tipo de coisa que uma história de marketing deixaria cair de fininho e que uma história honesta tem de manter.

---

## O que quebrou

Se uma história de construção não tem falhas nela, é marketing. Aqui estão as que vale a pena contar, porque cada uma é um motivo pelo qual o sistema é mais confiável agora, não menos.

- **O susto dos $400.** Uma manhã pareceu que uma chave de API medida tinha silenciosamente queimado um saldo de crédito. Não era gasto excessivo, era um *bug*: um carregador de configuração tinha vazado uma chave de API real para o ambiente, e um subprocesso lançou o CLI sem limpá-la, então a ferramenta cobrou da API medida em vez da minha assinatura. Uma correção de código, não um buraco no orçamento. Mas é exatamente o tipo de vazamento de custo silencioso que uma história de "é basicamente de graça" nunca admitiria, e tê-lo encontrado é por que confio nos números de custo acima.
- **"O GLM está fora do ar."** Por um tempo a camada de crítica ficou retornando erros de saldo e presumimos que a conta estava seca. Não estava. Era o *endpoint errado*, uma chave, duas superfícies, e a frota estava apontada para a de pagamento por uso com saldo vazio enquanto meu plano real ficava em uma URL diferente. Reaponte, e o crítico real voltou. A lição que ficou: um crítico que silenciosamente recorre a um substituto é pior do que um crítico que falha ruidosamente, então o recuo agora é ruidoso.
- **Os críticos que engasgaram em revisões grandes.** Nas duas execuções mais longas, os críticos de raciocínio que rodam a auditoria adversarial começaram a estourar o tempo limite, não pela dificuldade do trabalho, mas pelo *tamanho* da carga de revisão quando um módulo inteiro era entregue de uma vez. Era um problema de arcabouço, entradas grandes demais, não um modelo morto; ambos os críticos sondaram saudáveis. É por isso que a execução de pesquisa precisou do recuo delimitado descrito acima, e por que a correção, aparar e fatiar a revisão, ajustar os tempos limite, é agora um follow-up rastreado em vez de uma surpresa. Uma camada de verificação que silenciosamente desistisse seria pior que inútil; esta falhou ruidosamente o bastante para que eu tivesse de lidar com isso.
- **A auditoria que pegou a trapaça.** Em um sprint a própria auditoria da frota sinalizou um worker tentando fazer merge das mudanças de dois arquivos sob uma contagem de edições inflada, um desvio de contenção. A camada adversarial pegou isso *antes* do commit. A resposta imune do sistema funcionou sobre o próprio sistema.
- **O asterisco honesto sobre "zero intervenções".** Zero é verdade para as execuções. Mas o modelo coordenador de fato aplicou automaticamente algumas correções de auditoria que o manager então revisou, um comportamento que eu observo deliberadamente, porque "o agente corrigiu e um manager conferiu" não é o mesmo que "um humano conferiu", e eu prefiro nomear a costura do que fingir que ela não está lá.

Nenhuma dessas é vergonhosa. Elas são a textura de um sistema real sendo construído por workers reais (artificiais), com verificação suficiente ao redor deles para que as falhas apareçam cedo e barato.

---

## O que significa

Recue dos comprovantes e das histórias de bugs, e eis a afirmação que as quatro execuções de fato conquistam:

- **A autonomia de longo horizonte é real e repetível.** Quatro execuções sem supervisão, de cerca de quatro horas e meia a cerca de treze, aproximadamente trinta e uma horas no total, 789 novos testes, zero regressões, todas as quatro com merge. Não uma tarde de sorte. Uma forma de construir que se reproduz.
- **A confiabilidade é estrutural.** Críticos descorrelacionados, um viés de falha por padrão, uma espinha de verificação que mede a própria honestidade, um sandbox que assume que o modelo é hostil, uma revisão direcionada que caça o que o portão pode ter deixado passar. Modelos baratos, conferidos, não confiados. E quando a própria conferência ficou tensionada, nas duas execuções longas, ela ficou tensionada *ruidosamente*, que é o único tipo de falha que uma camada de verificação tem permissão de ter.
- **A soberania é arquitetural, e está ficando mais literal.** O sistema entregue não tem dependência rígida de nenhum modelo: papéis se resolvem em classes de capacidade com recuos, e a *mão de obra* de build rodou em modelos comuns, com um recuo de auditoria delimitado e apenas de assinatura que eu nomeei. Ainda *não* é verdade que a coisa toda roda isolada da rede em pesos abertos que eu mesmo hospedo, o grosso da autoria são APIs de commodity na nuvem, e o conductor é um modelo de fronteira. Mas duas dessas execuções empurraram essa linha: o modelo de visão que ancora o uso de computador, e o piso de modelo comprovado para pesquisa profunda, ambos rodaram em pesos abertos na minha própria GPU. O que é totalmente verdade hoje é que nenhum fornecedor sozinho é estruturalmente carregador de peso. Bane um, perde uma chave, vê um pico de preço, e a classe se resolve de novo para o próximo provedor, até o local se eu o ligar assim. Essa é a propriedade que sobrevive a uma proibição de exportação. Não "nunca toca a fronteira", mas "nunca *depende* dela".

O que nos traz de volta àquela semana de junho. Um modelo de fronteira apagou por diretiva, e para a maioria das pessoas que construíam sobre ele não havia nada a fazer senão esperar. O sistema que eu vinha construindo continuou rodando, porque a capacidade nunca esteve alojada no único modelo que outra pessoa podia desligar.

É essa a ideia inteira. Possua o arcabouço. Alugue a inteligência, de quem for mais barato e disponível nesta semana. E construa a coisa que torna essa troca segura, bem o bastante para que ela possa construir a si mesma, quatro vezes seguidas, e honesta o bastante para lhe mostrar exatamente quanto isso custou e exatamente onde ainda está áspero.

Ela construiu a si mesma. Aqui estão os comprovantes. Aqui está o que quebrou. Esse é o argumento.

---

*Documento complementar: o whitepaper técnico (arquitetura, a espinha de verificação, a economia em detalhe) e a auditoria do livro-razão de afirmações contra a qual cada número aqui foi reconciliado.*
