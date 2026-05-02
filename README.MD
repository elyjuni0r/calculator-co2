# Calculadora de Emissão de CO2 🌍

A **Calculadora de Emissão de CO2** é uma ferramenta interativa desenvolvida para conscientizar usuários sobre o impacto ambiental de seus deslocamentos. O projeto estima a pegada de carbono de viagens com base em distância, modo de transporte e perfis de trajeto, incentivando escolhas mais sustentáveis.

---

## 🚀 Funcionalidades

*   **Cálculo de Emissões**: Estimativa baseada em fatores de emissão validados para diferentes modais (Carro, Ônibus, etc.).
*   **Comparativo de Sustentabilidade**: Destaca a economia de $CO_2$ ao utilizar modais coletivos em comparação ao transporte individual.
*   **Autocomplete de Cidades**: Integração para facilitar o preenchimento de origem e destino.
*   **Preenchimento Automático de Distância**: Sugestão de quilometragem baseada na rota selecionada.
*   **Dark Mode Eco-Friendly**: Interface moderna com temática escura, otimizada para reduzir o consumo de energia e melhorar a legibilidade.
*   **Créditos de Carbono**: Estimativa de custo para compensação ambiental da viagem realizada.

---

## 🛠️ Tecnologias Utilizadas

*   **HTML5/CSS3**: Estrutura e estilização avançada com variáveis CSS para suporte a temas.
*   **JavaScript (Vanilla)**: Lógica de negócio, manipulação de DOM e processamento de dados.
*   **GitHub Pages**: Hospedagem e deploy contínuo da aplicação.

---
## ⚙️ Como Executar
Clone este repositório.

Abra o arquivo index.html em seu navegador ou utilize a extensão Live Server no VS Code.

Preencha os dados da viagem e clique em Calcular Emissão.

## 📂 Estrutura do Projeto

O projeto segue uma arquitetura modular para facilitar a manutenção:

*   `index.html`: Estrutura principal da interface.
*   `js/app.js`: Inicialização e gerenciamento de eventos de submissão.
*   `js/config.js`: Funções de suporte (Datalist e Autofill).
*   `js/ui.js`: Renderização de resultados e controle de estados da interface (Loading/Scroll).
*   `js/calculator.js`: Motor de cálculo das emissões e comparações.
*   `css/style.css`: Estilização completa e definições do Dark Mode.

---


---

## 📝 Detalhes Técnicos (Workflow)

O fluxo de processamento segue rigorosamente os seguintes passos:
1.  **Captura de Dados**: Limpeza de espaços (`trim`) e validação de inputs.
2.  **Simulação de Processamento**: Uso de `setTimeout` (1500ms) para melhorar a experiência do usuário (UX).
3.  **Lógica de Negócio**: Cálculo da emissão principal, comparação com *baseline* de carro e cálculo de créditos de carbono.
4.  **Renderização Dinâmica**: Atualização do DOM com os resultados e exibição dos cards de economia através da classe `UI`.

---

**Contribuindo para um futuro mais verde, um clique de cada vez.** 🌿