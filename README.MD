# Calculadora de Emissão de CO<sub>2</sub> 🌍

> **Status do Projeto:** 🟢 Produção (Deploy via GitHub Actions)  
> **Acesse agora:** [https://elyjuni0r.github.io/calculator-co2/](https://elyjuni0r.github.io/calculator-co2/)

A **Calculadora de Emissão de CO2** é uma solução interativa voltada para a educação ambiental. Ela permite que usuários estimem o impacto ecológico de seus deslocamentos, fornecendo dados precisos sobre a pegada de carbono e sugerindo caminhos para a compensação ambiental através de créditos de carbono.

---

## 🚀 Funcionalidades Principais

*   **Cálculo de Emissões Multi-Modal**: Processamento de dados baseado em fatores de emissão validados para diferentes tipos de transporte (Carro, Ônibus, Avião, etc.).
*   **Comparativo Inteligente**: Sistema de *baseline* que demonstra a economia gerada ao optar por transporte coletivo em vez de individual.
*   **UX Otimizada**:
    *   **Autocomplete**: Sugestão dinâmica de cidades para origem e destino.
    *   **Autofill**: Estimativa automática de distância com base na rota selecionada.
    *   **Feedback Visual**: Transições suaves e estados de carregamento para simular o processamento de dados.
*   **Eco Dark Mode**: Interface personalizada com tons de verde esmeralda e cinzas profundos, reduzindo a fadiga visual e o consumo de energia em telas OLED.
*   **Módulo de Compensação**: Integração visual de informações sobre o mercado voluntário de créditos de carbono (CBIO/VERRA).

---

## 🛠️ Stack Tecnológica & Arquitetura

O projeto foi construído utilizando **Vanilla JavaScript (ES6+)** seguindo princípios de modularidade para facilitar a escalabilidade e manutenção.

### Estrutura de Arquivos
*   `index.html`: Ponto de entrada com estrutura semântica.
*   `css/style.css`: Estilização completa, incluindo variáveis de tema para Dark Mode e correções de compatibilidade (Vendor Prefixes).
*   `js/app.js`: Orquestrador central; gerencia o ciclo de vida da aplicação e eventos de entrada.
*   `js/ui.js`: Camada de apresentação; lida com toda a manipulação de DOM, renderização de resultados e efeitos de scroll.
*   `js/calculator.js`: Motor de cálculo; contém a lógica matemática e os fatores de conversão de emissões.
*   `js/config.js`: Utilitários de configuração; gerencia os dados de autocomplete e preenchimento automático.

---

## 📝 Detalhes Técnicos (Workflow)

A lógica de processamento foi desenhada para garantir integridade dos dados e uma experiência fluida:

1.  **Saneamento de Dados**: Utilização de `.trim()` e validações rigorosas para evitar cálculos com entradas vazias ou inválidas.
2.  **Processamento Assíncrono Simulado**: Implementação de `setTimeout` (1500ms) para fornecer feedback visual ao usuário enquanto o "motor" calcula os resultados.
3.  **Renderização Dinâmica**: Uso estratégico de `innerHTML` para injetar resultados nos containers `results-content`, `comparison-content` e `carbon-credits-content`.
4.  **Correção de UI**: Ajustes finos de posicionamento (CSS Relative/Absolute) garantem que o botão de compensação e os textos explicativos não se sobreponham em diferentes tamanhos de tela.

---

## 📦 CI/CD e Deploy

O projeto utiliza **GitHub Actions** para automação de deploy. Toda atualização na branch `main` dispara um workflow que valida e publica os arquivos estáticos diretamente no **GitHub Pages**.

**Configuração do Workflow:**
*   **Gatilho**: Push na `main` ou disparo manual (`workflow_dispatch`).
*   **Ambiente**: Ubuntu-latest.
*   **Segurança**: Permissões granulares de leitura de conteúdo e escrita de páginas (`pages: write`).

---

## ⚙️ Como Executar Localmente

1.  Clone este repositório:
    ```bash
    git clone [https://github.com/elyjuni0r/calculator-co2.git](https://github.com/elyjuni0r/calculator-co2.git)
    ```
2.  Navegue até o diretório:
    ```bash
    cd calculator-co2
    ```
3.  Execute através do **Live Server** no VS Code ou abra o arquivo `index.html` diretamente em seu navegador moderno.

