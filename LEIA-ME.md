# Elo · Página de cadastro de usuários

Página simples, pensada para o celular, em que o administrativo de sala e a liderança de captação cadastram **uma pessoa por vez**: um parceiro ou alguém da equipe. A sala e o nome de quem envia ficam guardados no aparelho depois do primeiro envio. Cada cadastro vai para uma planilha do Google, em uma aba por sala.

**Arquivos**
- `index.html`: a página, que vai para o GitHub Pages.
- `Code.gs`: o script que grava na planilha, colado no Apps Script.

---

## 1. Planilha e script (cerca de 10 minutos)

1. Crie uma planilha no Google Sheets com o nome **Elo – Cadastro de usuários**, usando a conta corporativa que vai administrar os dados.
2. Abra **Extensões > Apps Script**, apague o conteúdo do arquivo `Código.gs`, cole todo o conteúdo de `Code.gs` e salve.
3. No topo do script, troque `CODIGO_ACESSO = 'ELO2026'` por um código seu. Ninguém precisa digitar esse código: ele vai embutido no link (veja o passo 4).
   - Se quiser um código diferente por sala, preencha `CODIGOS_POR_SALA`.
   - Se quiser receber um e-mail a cada envio, preencha `EMAIL_AVISO`.
4. Clique em **Implantar > Nova implantação**:
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Autorize o acesso quando o Google pedir. Se aparecer "app não verificado", clique em *Avançado > Acessar*.
6. Copie a **URL do App da Web**. Ela termina em `/exec`.

> Para testar, abra essa URL no navegador. Deve aparecer `{"ok":true,...}`.

## 2. Ligar a página à planilha

Abra o `index.html` num editor de texto, procure a linha abaixo e cole a URL entre as aspas:

```js
const SCRIPT_URL = "";
```

Enquanto essa linha estiver vazia, a página mostra uma faixa de **Modo de teste** e não grava nada.

## 3. Publicar no GitHub Pages

1. No GitHub, crie um repositório, por exemplo `elo-cadastro`.
2. Envie o arquivo `index.html` pelo caminho **Add file > Upload files** e clique em *Commit*.
3. Abra **Settings > Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main** e **/(root)**
   - Clique em *Save*
4. Em 1 a 2 minutos, o link fica disponível em `https://SEU-USUARIO.github.io/elo-cadastro/`.

## 4. Testar antes de divulgar

1. Abra o link, preencha com dados de teste e envie.
2. Confira se a planilha criou a aba da sala e a aba **Resumo**.
3. Apague as linhas de teste.
4. Monte o link para as equipes **com o código no final**, assim:

   `https://SEU-USUARIO.github.io/elo-cadastro/?c=SEUCODIGO`

   Com esse link, a página não pede código nenhum. Se alguém abrir o link sem o `?c=`, a página pede o código uma única vez.
5. Mande esse link **só** para a supervisão, o administrativo de sala e a liderança de captação.

---

## Como a planilha funciona

- **Uma aba por sala**, criada automaticamente no primeiro envio da sala.
- **Coluna Status:** todo cadastro novo entra como `Pendente`. Depois de criar o usuário no Elo, troque para `Usuário criado` e preencha "Usuário criado em" e "Responsável Elo".
- **CPF repetido:** se o CPF já existir na aba da sala, a linha é gravada com o status `Conferir: CPF já cadastrado`, e quem enviou é avisado na tela.
- **Aba Resumo:** mostra, por sala, quantos parceiros e pessoas da equipe foram enviados, quantos estão pendentes e quantos usuários já foram criados. É atualizada a cada envio.

## Mudanças comuns

- **Adicionar ou renomear salas:** edite a lista `SALAS` no `index.html` e envie o arquivo de novo ao GitHub.
- **Alterar o script:** depois de editar, use **Implantar > Gerenciar implantações > ✏️ > Versão: Nova versão**. Assim a URL continua a mesma. Se fizer uma "Nova implantação", a URL muda e precisa ser trocada no `index.html`.
- **Trocar o código de acesso:** edite `CODIGO_ACESSO`, publique uma nova versão e mande o link novo com o código atualizado. Quem estiver com o código antigo vê o aviso "Código incorreto".

## Cuidados com os dados (LGPD)

- Compartilhe a planilha só com quem cria os usuários no Elo.
- O repositório do GitHub pode ser público. Ele contém só a página. Os dados ficam apenas na planilha.
- A página guarda no aparelho só a sala, o nome de quem envia e o código. Os dados das pessoas cadastradas não ficam salvos no aparelho.
- Quando a implantação terminar, desative o App da Web em **Implantar > Gerenciar implantações > Arquivar**.
