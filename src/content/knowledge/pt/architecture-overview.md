---
title: "Como o BoB é construído"
description: "Um passeio direto pela arquitetura: o harness, a frota, a espinha de verificação e o substrato por baixo."
category: "Architecture"
format: "Write-up"
date: 2026-06-30
order: 1
---

A maioria das ferramentas de IA trata o modelo como o produto e o código ao redor dele como mera cola. O BoB inverte isso. O modelo é uma peça intercambiável, como uma CPU. O que torna o BoB confiável, produtivo e seu é o **harness** ao redor do modelo. Este é um passeio rápido por esse harness.

## Quatro serviços

O BoB é composto por quatro peças que cooperam entre si:

- o **core** comanda tudo: ele roteia o trabalho, o distribui por uma frota de modelos, verifica os resultados e mantém um registro durável de tudo.
- o **gateway** é a porta: uma camada web e de API com login, conversas, projetos e aprovações.
- o **pipeline** é um invólucro fino para a camada de planejamento.
- o **app** é o cliente desktop, a ferramenta do dia a dia, com chat, uma visão de roteamento e um construtor de equipes.

Tudo o que é substancial acontece dentro do core, como um grafo compilado pelo qual uma requisição flui.

## A frota

O BoB não se apoia em um único modelo. O trabalho é expresso como **papéis**, não como fornecedores:

- um **apex** que planeja e decompõe uma tarefa,
- **workers** que fazem o trabalho pesado,
- **critics** que checam o trabalho de forma adversarial.

Cada papel se resolve em um modelo concreto por meio de uma camada de roteamento, de modo que a mesma tarefa pode rodar como um único worker barato, um fan-out de dezenas ou um conselho deliberativo, por configuração e não por código. A regra deliberada é a **descorrelação entre famílias**: um critic sempre vem de uma família de modelos diferente da do worker que ele audita, para que um modelo nunca chancele o seu próprio tipo de erro.

## A espinha de verificação

Esta é a parte que transforma modelos baratos em modelos confiáveis. Antes de um resultado poder valer, o BoB o verifica:

- uma **checagem de pós-condição** pergunta a um critic descorrelacionado se o resultado alegado de fato se sustenta,
- um **portão de acarretamento de alegações** reabre a fonte citada para qualquer alegação quantitativa e pergunta: essa fonte realmente sustenta esse número?
- a **terminação por falha padrão** significa que todo critério de conclusão começa como não verificado, e o trabalho só é entregue quando cada um deles é verificado ou honestamente marcado como desconhecido.

"Pronto" é algo que o BoB conquista, não algo que ele presume.

## Três pistas

A mesma espinha impulsiona três tipos de trabalho:

- a **pista de build** escreve código contra contratos e o executa dentro de um sandbox isolado antes de confiar nele,
- a **pista de research** responde perguntas com fontes que ela de fato relê,
- a **pista de computer-use** opera software real, verificando que a tela mudou da maneira pretendida.

## Memória e o substrato

O BoB é construído sobre uma base de conhecimento local viva. O conhecimento é compilado uma vez e mantido atualizado, de modo que o BoB fica mais afiado sobre o seu trabalho ao longo do tempo, em vez de começar do zero a cada sessão. Por baixo, um ledger append-only é o sistema de registro: o BoB reconstrói o contexto fatiando esse ledger, e não confiando no que por acaso tenha sobrado na janela de contexto de um modelo.

## Soberania, por design

Como nenhum modelo é nomeado na lógica, apenas classes de capacidade com cadeias de fallback, nenhum fornecedor isolado é indispensável. Bania um modelo, perca uma chave ou veja um pico de preço, e a classe se resolve novamente para o próximo provedor, chegando até à inferência local se você quiser. Essa é a propriedade que sobrevive a uma proibição de exportação. Você é dono do harness. Você aluga a inteligência, de quem for mais barato e estiver disponível nesta semana.

Para o tratamento completo, leia o [whitepaper técnico](/knowledge/bobclaw-whitepaper/).
