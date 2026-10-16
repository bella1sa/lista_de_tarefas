const express = require('express');
const app = express();
app.use(express.json()); 

let tarefas = [
 { id: 1, titulo: 'Aprender Express', concluida: false,prioridade: 'alta' },
 { id: 2, titulo: 'Criar minha primeira API', concluida: false, prioridade: 'média' }
];
let proximoId = 3;

// LISTAR todas as tarefas (com filtro opcional por status)
app.get('/tarefas', (req, res) => {
 const { concluida, prioridade } = req.query; //req.query.concluida aceita qualquer valor sem checar se é booleano
 let resultado = tarefas;
 
 if (concluida !== undefined) {
 resultado = tarefas.filter(t => t.concluida === (concluida === 'true'));
 }

 if (prioridade !== undefined) {
 resultado = resultado.filter(t => t.prioridade === prioridade);
 }
 res.json(resultado);
});

//RESUMO das tarefas
app.get('/tarefas/resumo', (req, res) => {
 const total = tarefas.length;
 const concluidas = tarefas.filter(t => t.concluida === true).length;
 const pendentes = tarefas.filter(t => t.concluida === false).length;
 res.json({ total: tarefas.length,concluidas, pendentes });
});

// BUSCAR uma tarefa especifica
app.get('/tarefas/:id', (req, res) => {
 const tarefa = tarefas.find(t => t.id === parseInt(req.params.id)); //req.params.id convertido sem validar se é um numero real
 if (!tarefa) return res.status(404).json({ erro: 'Tarefa nao encontrada' });
 res.json(tarefa);
});

// CRIAR uma nova tarefa
app.post('/tarefas', (req, res) => {
 const { titulo, prioridade } = req.body;

 if (!titulo || titulo.trim() === '') 
    return res.status(400).json({ erro: 'O campo "titulo" e obrigatorio' // req.body.titulo apenas verifica exisencia, aceita espaços vazios ou tipos invalidos
});
const tituloExiste = tarefas.some(t => t.titulo.toLowerCase() === titulo.trim() .titulo.toLowerCase());
 if (tituloExiste) {
 return res.status(400).json({ erro: 'Tarefa com este titulo ja existe' });
 }
 
 const novaTarefa = { 
    id: proximoId++, 
    titulo: titulo.trim(),
    concluida: false,
    prioridade: prioridade || 'baixa' 
};

 tarefas.push(novaTarefa);
 res.status(201).json(novaTarefa);
});

// ATUALIZAR uma tarefa (ex: marcar como concluida)
app.put('/tarefas/:id', (req, res) => {
 const tarefa = tarefas.find(t => t.id === parseInt(req.params.id)); // req.params.id sem validacao previa de tipo
 if (!tarefa) return res.status(404).json({ erro: 'Tarefa nao encontrada' });

 const { titulo, concluida, prioridade } = req.body; // req.body aceita novos dados sem checar tipo ou tamanho

 if (titulo !== undefined) tarefa.titulo = titulo;
 if (concluida !== undefined) tarefa.concluida = concluida;
 if (prioridade !== undefined) tarefa.prioridade = prioridade;
 res.json(tarefa);
});

// DELETAR uma tarefa
app.delete('/tarefas/:id', (req, res) => {
 const index = tarefas.findIndex(t => t.id === parseInt(req.params.id)); //req.params.id processado diretamente sem checagem 
 if (index === -1) return res.status(404).json({ erro: 'Tarefa nao encontrada' });

 tarefas.splice(index, 1);
 res.status(204).send();
});

app.listen(3000, () => console.log('API de tarefas rodando na porta 3000'));

// • Descubra por que os dados somem ao reiniciar o servidor e explique com suas palavras
// Os dados somem quando o servidor reinicia porque eles ficam guardados só na memória RAM do computador, dentro do código. Como a memória RAM é temporária, tudo o que está lá se apaga assim que a gente fecha ou reinicia o programa. Para não perder nada, a gente precisa de usar uma base de dados de verdade, como o PostgreSQL