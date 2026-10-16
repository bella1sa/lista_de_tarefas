const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

// LISTAR tarefas (com filtro opcional por status)
app.get('/tarefas', async (req, res) => {
  try {
    const { concluida, prioridade, limite = 10, pagina = 1 } = req.query; //req.query recolhe dados da URL sem validar se sao do tipo correto

    let query = 'SELECT * FROM tarefas WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (concluida !== undefined) {
      query += ` AND concluida = $${paramIndex}`;
      params.push(concluida === 'true');
      paramIndex++;
    }

    if (prioridade !== undefined) {
      query += ` AND prioridade = $${paramIndex}`;
      params.push(prioridade);
      paramIndex++;
    }
    const limitNum = parseInt(limite); //limite vem da query e é convertido sem checar se é um numero positivo real
    const offsetNum = (parseInt(pagina) - 1) * limitNum;// pagina vem da query e é convertido sem valodacao previa

    query += ` ORDER BY id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offsetNum);

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar tarefas' });
  }
});

// BUSCAR uma tarefa especifica
app.get('/tarefas/estatisticas', async (req, res) => {
  try {

    const resultado = await pool.query(
      'SELECT concluida, COUNT(*) as total FROM tarefas GROUP BY concluida'
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao gerar estatísticas' });
  }
});


// BUSCAR UMA TAREFA ESPECÍFICA POR ID

app.get('/tarefas/:id', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM tarefas WHERE id = $1', [req.params.id]); //req.params.id é enviado para a query sem validar previamente se é um numero
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar tarefa' });
  }
});

// CRIAR UMA NOVA TAREFA
app.post('/tarefas', async (req, res) => {
  try {
    const { titulo, prioridade } = req.body;

    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({ erro: 'O campo "titulo" é obrigatório' }); //apenas verifica se existe, aceitando strings vazias com espacos ("") ou tipos invalidos
    }
    const resultado = await pool.query(
      'INSERT INTO tarefas (titulo, prioridade) VALUES ($1, $2) RETURNING *',
      [titulo.trim(), prioridade || 'baixa']
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar tarefa' });
  }
});

// ATUALIZAR UMA TAREFA
app.put('/tarefas/:id', async (req, res) => {
  try {
    const { titulo, concluida, prioridade } = req.body; //req.body traz dados nao validados para atualizacao

    const tarefaAtual = await pool.query('SELECT * FROM tarefas WHERE id = $1', [req.params.id]);//req.params.id sem checagem de tipo
    if (tarefaAtual.rows.length === 0) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    const atual = tarefaAtual.rows[0];
    const novoTitulo = titulo !== undefined ? titulo : atual.titulo;
    const novaConcluida = concluida !== undefined ? concluida : atual.concluida;
    const novaPrioridade = prioridade !== undefined ? prioridade : atual.prioridade;

    const resultado = await pool.query(
      'UPDATE tarefas SET titulo = $1, concluida = $2, prioridade = $3 WHERE id = $4 RETURNING *',
      [novoTitulo, novaConcluida, novaPrioridade, req.params.id]
    );

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
  }
});


//  DELETAR UMA TAREFA POR ID
app.delete('/tarefas/:id', async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM tarefas WHERE id = $1 RETURNING *', [req.params.id]); //req.params.id usado diretamente sem validacao previa
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao deletar tarefa' });
  }
});

app.listen(3000, () => console.log('API de tarefas (Versão 2) a rodar na porta 3000'));

// se o servidor reiniciasse na versao 2 os dados continuariam salvos e seguros, pois sao guardados numa base de dados postgre. e na versao 1, todos os dados seriam perdidos, uma vez que a informacao fica armazenada apenas temporariamente num array na memoria do servidor