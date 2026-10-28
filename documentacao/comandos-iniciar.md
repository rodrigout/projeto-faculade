# Comandos para Iniciar o ScanBox

Este documento contém as instruções para rodar a aplicação localmente.

---

## 1. Como iniciar a API (Backend)
O backend usa FastAPI e o banco de dados SQLite (`boxes.db`).

1. Abra um terminal na pasta do projeto.
2. Inicie o servidor:
   ```bash
   uv run --with "fastapi[standard]" --with sqlalchemy python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8001
   ```
   *(A API fica disponível em http://0.0.0.0:8001 e a documentação interativa Swagger em http://<IP>:8001/docs)*

> **Nota sobre portas**: Caso a porta 8000 esteja livre na sua máquina e queira usá-la, basta ajustar o parâmetro `--port 8000` e a variável `VITE_API_URL` no arquivo `.env`.

---

## 2. Como iniciar o Painel (Frontend)
O frontend usa React + Vite + TanStack Start.

1. Abra **um novo terminal** (mantenha o da API rodando).
2. Na pasta do projeto, instale as dependências (se ainda não instalou):
   ```bash
   npm install
   ```
3. Inicie o painel de desenvolvimento:
   ```bash
   npm run dev
   ```
   *(O Painel ficará disponível em http://localhost:8080)*
