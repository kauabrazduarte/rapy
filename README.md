<p align="center">
  <img src="./stickers/feliz.webp" alt="Rapy" width="120" />
</p>

<h1 align="center">Rapy <img src="./stickers/feliz.webp" width="20"/></h1>
<p align="center"><i>Uma raposa feliz, intrigante e passiva-agressiva para o seu WhatsApp.</i></p>

---

## <img src="./stickers/pensando.webp" width="20"/> Sobre

Rapy não é apenas um bot — é um novo membro do seu grupo. Ela **analisa, entende e interage** com as conversas de forma natural, sem depender de comandos chatos. Responde quando quer, com personalidade de **adolescente brasileira de 16 anos**, e ainda usa **IA contextual** para manter conversas mais divertidas e inteligentes.

---

## <img src="./stickers/feliz.webp" width="20"/> Características

| Função                      | Descrição                                                         |
| --------------------------- | ----------------------------------------------------------------- |
| **Personalidade Autêntica** | Linguagem natural, gírias e expressões brasileiras.               |
| **IA Contextual**           | Responde com base no histórico e contexto das mensagens.          |
| **Múltiplos Formatos**      | Texto, stickers, enquetes, localização, memes, áudios e contatos. |
| **Sistema de Memória**      | Lembra interações e gera resumos automáticos.                     |
| **Detecção de Atividade**   | Ajusta tempo de resposta conforme movimento no grupo.             |
| **Emoções Dinâmicas**       | “Sentimento” diferente para cada membro, que muda com o tempo.    |
| **Otimização de Tokens**    | Gasta o mínimo possível mantendo a qualidade.                     |
| **Entende áudios**          | Rapy tem a capacidade de escutar áudios.                          |

---

## <img src="./stickers/livre-para-falar.webp" width="20"/> Tipos de Resposta

- **💬 Texto** — Respostas naturais com gírias e expressões.
- **↩️ Reply** — Responde mensagens específicas.
- **<img src="./stickers/feliz.webp" width="20"/> Stickers** — 12 stickers expressivos para diversas situações.
- **📊 Enquetes** — Polls divertidas e interativas.
- **📍 Localização** — Envia coordenadas quando relevante.
- **<img src="./stickers/rindo-fininho.webp" width="20"/> Memes** — Memes pré-configurados para usar no momento certo.
- **🎙️ Áudios** — Respostas por áudio gravadas previamente.
- **📇 Contatos** — Contatos fictícios (tipo o do Elon Musk).

---

## <img src="./stickers/pensando.webp" width="20"/> Inteligência

- **Resumos Automáticos** para conversas longas.
- **Contexto Persistente** com memória local.
- **Detecção de Agitação** no grupo.
- **Debounce Inteligente** para evitar spam.
- **Logs Detalhados** com custo estimado de cada resposta.
- **Humor diário** para as conversas do grupo.

---

## <img src="./stickers/suspeito.webp" width="20"/> Tecnologias

- **TypeScript** — Linguagem principal.
- **Node.js** — Runtime.
- **Baileys** — Cliente WhatsApp Web.
- **Vercel AI SDK** — Geração de respostas inteligentes.
- **OpenAI API** — Suporte ao Vercel AI SDK e transcrição de áudios.

---

## <img src="./stickers/surpreso.webp" width="20"/> Instalação

```bash
# Clone o repositório
git clone https://github.com/oKauaDev/rapy.git
cd rapy

# Instale as dependências
npm install

# Configure o .env
echo "OPENAI_API_KEY=sua_chave_aqui" > .env

# Execute o projeto
npm run dev      # Modo desenvolvimento
npm run build    # Compilar para produção
npm start        # Executar em produção
```

---

## <img src="./stickers/entediado.webp" width="20"/> Variáveis de Ambiente

```env
OPENAI_API_KEY=sua_chave_da_openai
NODE_ENV=development # ou production
```

---

## <img src="./stickers/comendo.webp" width="20"/> Como Funciona

1. **Conexão** com o WhatsApp Web via Baileys.
2. **Escuta** mensagens em grupos.
3. **Analisa** histórico e atividade do grupo.
4. **Responde** com personalidade definida.
5. **Memória** salva interações e gera resumos automáticos.

---

## <img src="./stickers/comendo-com-selfie.webp" width="20"/> Stickers, Memes e Áudios

- **Memes** → Adicione na pasta `memes` com nome descritivo.
- **Áudios** → Adicione na pasta `audios` com nome resumido.
- **Stickers** → Coloque na pasta `real-stickers` (formato `.webp`), depois rode:

  ```bash
  npm run format:stickers
  ```

---

## <img src="./stickers/livre-para-falar.webp" width="20"/> Scripts Disponíveis

```bash
npm run dev              # Modo desenvolvimento
npm run build            # Compilar para produção
npm start                # Executar em produção
npm run format:stickers  # Formatar stickers
```

---

## <img src="./stickers/feliz.webp" width="20"/> Contribuindo

1. **Fork** este repositório.
2. Crie sua branch: `git checkout -b feature/NovaFuncionalidade`.
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`.
4. Push: `git push origin feature/NovaFuncionalidade`.
5. Abra um Pull Request.

---

## <img src="./stickers/feliz.webp" width="20"/> Autor

**Kauã Braz**
🌐 [kaua.dev.br](https://kaua.dev.br)
💻 [@oKauaDev](https://github.com/oKauaDev)

---

## <img src="./stickers/pedindo-desculpas.webp" width="20"/> Avisos

- Use apenas em grupos com consentimento de todos.
- Mantenha sua chave da OpenAI segura.
- O bot armazena contexto local.
- Baileys não é oficial do WhatsApp — uso por sua conta e risco.

---

> _"Rapy é como aquele amigo que aparece no grupo e muda toda a dinâmica — para melhor (ou pior 😏)."_
