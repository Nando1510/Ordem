// ==========================================
// PARTE 1 - CONFIGURAÇÕES E INICIALIZAÇÃO
// ==========================================
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

// IMPORTAÇÃO DOS MODELOS
const Administrador = require('./models/Administrador');
const Cliente = require('./models/Cliente');
const Produto = require('./models/Produto');
const Venda = require('./models/Venda');
const OrdemServico = require('./models/OrdemServico');

const app = express(); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// CONFIGURAÇÃO DA SESSÃO
app.use(session({
  secret: 'seuSegredoUltraSecreto', // Recomenda-se usar variável de ambiente (process.env.SESSION_SECRET)
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Defina como true se utilizar HTTPS
}));

// CONEXÃO AO MONGODB
// CONECTA O SERVIDOR NODE.JS AO BANCO DE DADOS MONGODB
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://nandohanauer01_db_user:HH13TKCw03DJoLCz@cluster0.fbgabq9.mongodb.net/Ordem?retryWrites=true&w=majority';

// FUNÇÃO UTILITÁRIA PARA GERAR CUSTOM ID INCREMENTAL
async function gerarCustomId(Model) {
  const ultima = await Model.findOne().sort({ customId: -1 });
  return ultima && ultima.customId ? ultima.customId + 1 : 1;
}

// INICIALIZAÇÃO DO SERVIDOR
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


// ==========================================
// PARTE 2 - ADMINISTRADOR
// ==========================================

// CADASTRAR ADMINISTRADOR
app.post('/salvar_Administrador', async (req, res) => {
  try {
    const { nome, senha, celular } = req.body;

    const existente = await Administrador.findOne({ nome });
    if (existente) {
      return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
    }

    const customId = await gerarCustomId(Administrador);
    const administrador = new Administrador({ customId, nome, senha, celular });
    await administrador.save();

    console.log('Administrador salvo:', administrador);
    res.status(201).json({ message: 'Dados salvos com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar administrador:', error);
    res.status(500).json({ message: 'Erro ao salvar dados' });
  }
});

// LOGIN ADMINISTRADOR
app.post('/login', async (req, res) => {
  const { nome, senha } = req.body;
  try {
    const administrador = await Administrador.findOne({ nome });
    if (!administrador || administrador.senha !== senha) {
      return res.status(401).json({ message: 'Usuário ou senha inválidos!' });
    }

    req.session.adminId = administrador.customId;
    req.session.adminNome = administrador.nome;
    
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      administrador: {
        id: administrador.customId,
        nome: administrador.nome
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

// VERIFICAR SESSÃO
app.get('/verificar_sessao_administrador', (req, res) => {
  if (req.session && (req.session.adminId || req.session.adminNome)) {
    res.status(200).json({ logado: true, nome: req.session.adminNome || 'Administrador' });
  } else {
    res.status(200).json({ logado: false });
  }
});

// LOGOUT
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao encerrar sessão' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout realizado com sucesso!' });
  });
});

// LISTAR ADMINISTRADORES
app.get('/registros_Administrador', async (req, res) => {
  try {
    const registros = await Administrador.find();
    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar registros' });
  }
});

// ATUALIZAR ADMINISTRADOR
app.put('/atualizar_Administrador/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, senha, celular } = req.body;

  try {
    await Administrador.updateOne(
      { customId: id },
      { $set: { nome, senha, celular } }
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send('Erro ao atualizar registro');
  }
});

// EXCLUIR ADMINISTRADOR
app.delete('/excluir_Administrador/:customId', async (req, res) => {
  try {
    const id = parseInt(req.params.customId);
    await Administrador.findOneAndDelete({ customId: id });
    res.json({ message: 'Registro excluído!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir registro' });
  }
});


// ==========================================
// PARTE 3 - CLIENTE
// ==========================================

// CADASTRAR CLIENTE
app.post('/salvar_Cliente', async (req, res) => {
  try {
    const { nome, cpf_cnpj, telefone, celular, email, rua, numero, bairro, cidade, estado, cep } = req.body;
    
    const customId = await gerarCustomId(Cliente);
    const cliente = new Cliente({ customId, nome, cpf_cnpj, telefone, celular, email, rua, numero, bairro, cidade, estado, cep });
    await cliente.save();

    res.status(201).json({ message: 'Dados salvos com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    res.status(500).json({ message: 'Erro ao salvar dados' });
  }
});

// LISTAR CLIENTES (Ordenado por Nome)
app.get('/registros_Cliente', async (req, res) => {
  try {
    const registros = await Cliente.find().sort({ nome: 1 });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar registros de clientes' });
  }
});

// BUSCAR UM CLIENTE ESPECÍFICO PELO CUSTOM ID
app.get('/buscar_Cliente/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cliente = await Cliente.findOne({ customId: id });
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro interno ao buscar cliente' });
  }
});

// ATUALIZAR CLIENTE
app.put('/atualizar_Cliente/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, cidade, celular, cpf_cnpj, telefone, email, rua, numero, bairro, estado, cep } = req.body;

  try {
    const dadosParaAtualizar = {};
    if (nome !== undefined) dadosParaAtualizar.nome = nome;
    if (cidade !== undefined) dadosParaAtualizar.cidade = cidade;
    if (celular !== undefined) dadosParaAtualizar.celular = celular;
    if (cpf_cnpj !== undefined) dadosParaAtualizar.cpf_cnpj = cpf_cnpj;
    if (telefone !== undefined) dadosParaAtualizar.telefone = telefone;
    if (email !== undefined) dadosParaAtualizar.email = email;
    if (rua !== undefined) dadosParaAtualizar.rua = rua;
    if (numero !== undefined) dadosParaAtualizar.numero = numero;
    if (bairro !== undefined) dadosParaAtualizar.bairro = bairro;
    if (estado !== undefined) dadosParaAtualizar.estado = estado;
    if (cep !== undefined) dadosParaAtualizar.cep = cep;

    await Cliente.updateOne({ customId: id }, { $set: dadosParaAtualizar });
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao atualizar registro:', err);
    res.status(500).send('Erro ao atualizar registro');
  }
});

// EXCLUIR CLIENTE
app.delete('/excluir_Cliente/:customId', async (req, res) => {
  try {
    const id = parseInt(req.params.customId);
    await Cliente.findOneAndDelete({ customId: id });
    res.json({ message: 'Registro excluído!' });
  } catch (error) {
    console.error('Erro ao excluir:', error);
    res.status(500).json({ message: 'Erro ao excluir registro' });
  }
});

// ROTA PARA PÁGINA FÍSICA DE DETALHES
app.get('/clientes_Detalhe', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'clientes_Cadastro', 'clientes_Detalhe.html'));
});


// ==========================================
// PARTE 4 - PRODUTO
// ==========================================

// SALVAR OU ATUALIZAR PRODUTO
app.post('/salvar_Produto', async (req, res) => {
  try {
    const dados = req.body;

    if (dados._id) {
      // MODO ATUALIZAÇÃO
      const produtoExistente = await Produto.findById(dados._id);
      if (!produtoExistente) {
        return res.status(404).json({ message: 'Produto não encontrado para atualização.' });
      }

      const qtdAdicionar = parseInt(dados.qtd_adicionar) || 0;
      const novaQtdAtual = (produtoExistente.qtd_atual || 0) + qtdAdicionar;

      const dadosAtualizados = {
        descricao: dados.descricao || produtoExistente.descricao,
        qtd_atual: novaQtdAtual,
        preco_compra: parseFloat(dados.preco_compra) || produtoExistente.preco_compra,
        preco_unitario: parseFloat(dados.preco_unitario) || produtoExistente.preco_unitario,
        preco_venda: parseFloat(dados.preco_venda) || produtoExistente.preco_venda,
        estoque_minimo: parseInt(dados.estoque_minimo) || produtoExistente.estoque_minimo
      };

      const produtoAtualizado = await Produto.findByIdAndUpdate(dados._id, dadosAtualizados, { new: true });

      return res.json({ 
        message: 'Produto atualizado com sucesso!', 
        produto: produtoAtualizado 
      });

    } else {
      // MODO NOVO CADASTRO
      if (!dados.customId) {
        dados.customId = `PRD-${Date.now()}`;
      }

      const qtdAdicionar = parseInt(dados.qtd_adicionar) || 0;
      const qtdAtual = parseInt(dados.qtd_atual) || 0;
      dados.qtd_atual = qtdAtual > 0 ? qtdAtual : qtdAdicionar;

      const novoProduto = new Produto(dados);
      await novoProduto.save();

      return res.json({ 
        message: 'Produto cadastrado com sucesso!', 
        produto: novoProduto 
      });
    }

  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    res.status(500).json({ message: 'Erro ao salvar produto', error: error.message });
  }
});

// BUSCAR PRODUTOS (COM FILTRO E BUSCA RÁPIDA)
app.get('/buscar_Produtos', async (req, res) => {
  try {
    const termo = req.query.termo || '';
    let filtro = {};
    if (termo.trim() !== '') {
      filtro = { descricao: { $regex: termo.trim(), $options: 'i' } };
    }

    const produtos = await Produto.find(filtro).limit(30);
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro interno no servidor ao buscar produtos.' });
  }
});


// ==========================================
// PARTE 5 - VENDAS
// ==========================================

// FINALIZAR VENDA E DAR BAIXA EM ESTOQUE
app.post('/finalizar_Venda', async (req, res) => {
  try {
    const { itens, total, formaPagamento, cpf } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: "O carrinho de compras está vazio ou em formato inválido." 
      });
    }

    // Baixa no estoque
    for (const item of itens) {
      const rawId = item.id || item.customId;
      const quantidadeBaixa = Number(item.qtd) || 0;

      if (quantidadeBaixa <= 0) continue;

      const isRealObjectId = typeof rawId === 'string' && rawId.length === 24 && /^[0-9a-fA-F]{24}$/.test(rawId);

      if (isRealObjectId) {
        await Produto.findByIdAndUpdate(rawId, { $inc: { qtd_atual: -quantidadeBaixa } });
      } else if (rawId !== undefined && rawId !== null && !isNaN(Number(rawId))) {
        await Produto.updateOne({ customId: Number(rawId) }, { $inc: { qtd_atual: -quantidadeBaixa } });
      } else if (item.nomeProduto || item.descricao) {
        const nomeBusca = item.nomeProduto || item.descricao;
        await Produto.updateOne({ descricao: nomeBusca }, { $inc: { qtd_atual: -quantidadeBaixa } });
      }
    }

    // Cálculo do total
    let totalCalculado = Number(total);
    if (isNaN(totalCalculado) || totalCalculado <= 0) {
      totalCalculado = itens.reduce((acc, item) => acc + ((Number(item.preco) || 0) * (Number(item.qtd) || 0)), 0);
    }

    const formaPagamentoFinal = formaPagamento || 'Dinheiro';
    const customIdVenda = await gerarCustomId(Venda);

    const novaVenda = new Venda({
      customId: customIdVenda,
      produtos: itens.map(item => ({
        produtoId: String(item.id || item.customId || item.nomeProduto || ''),
        quantidade: Number(item.qtd) || 1,
        precoUnitario: Number(item.preco) || 0
      })),
      total: totalCalculado,
      formaPagamento: formaPagamentoFinal,
      cpfCliente: cpf || null,
      data: new Date()
    });

    await novaVenda.save();

    return res.status(200).json({ 
      sucesso: true, 
      mensagem: "Venda finalizada com sucesso e estoque atualizado!" 
    });

  } catch (erro) {
    console.error("Erro ao finalizar venda:", erro);
    return res.status(500).json({ 
      sucesso: false, 
      mensagem: "Erro interno no servidor ao processar a venda.",
      detalhe: erro.message 
    });
  }
});


// ==========================================
// PARTE 6 - ORDENS DE SERVIÇO
// ==========================================

// CADASTRAR NOVA ORDEM DE SERVIÇO (ATUALIZADA COM TODOS OS CAMPOS)
app.post('/cadastrar_os', async (req, res) => {
  try {
    const { 
      clienteId, 
      equipamento, 
      marcaModelo, 
      numeroSerie, 
      patrimonio, 
      dataEntrada, 
      dataSaida, 
      tempoGarantia, 
      garantiaServicoAnterior, 
      garantiaCompra, 
      defeito, 
      servicoRealizar, 
      situacao, 
      pecas, 
      valorMaoObra, 
      valorTotal 
    } = req.body;

    const ultimaOS = await OrdemServico.findOne().sort({ createdAt: -1 });

    let proximoNumero = 1;
    if (ultimaOS && ultimaOS.numeroOS) {
      proximoNumero = Number(ultimaOS.numeroOS) + 1;
    }

    const novaOS = new OrdemServico({
      clienteId,
      numeroOS: String(proximoNumero),
      equipamento,
      marcaModelo,
      numeroSerie,
      patrimonio,
      dataEntrada,
      dataSaida,
      tempoGarantia,
      garantiaServicoAnterior,
      garantiaCompra,
      defeito,
      servicoRealizar,
      situacao: situacao || 'Aguardando',
      pecas: pecas || [],
      valorMaoObra: valorMaoObra || 0,
      valorTotal: valorTotal || 0
    });

    await novaOS.save();
    res.status(201).json({ mensagem: 'OS criada com sucesso!', os: novaOS });

  } catch (error) {
    console.error('Erro ao cadastrar OS:', error);
    res.status(500).json({ mensagem: 'Erro interno ao cadastrar a Ordem de Serviço.' });
  }
});

// OBTER SESSÃO E ORDENS DE UM CLIENTE
app.get('/obter_sessao_cliente/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    const numId = !isNaN(Number(rawId)) ? Number(rawId) : null;

    let cliente = null;
    if (numId !== null) {
      cliente = await Cliente.findOne({ customId: numId });
    }
    if (!cliente) {
      cliente = await Cliente.findOne({ 
        $or: [{ customId: rawId }, { _id: mongoose.Types.ObjectId.isValid(rawId) ? rawId : null }] 
      });
    }

    if (!cliente) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }

    const buscaIDs = [String(cliente.customId), cliente.customId, String(cliente._id)];
    if (numId !== null) buscaIDs.push(numId);

    const ordens = await OrdemServico.find({ 
      clienteId: { $in: buscaIDs } 
    }).sort({ createdAt: -1 });

    res.json({ cliente, ordens });
  } catch (err) {
    console.error('Erro ao carregar sessão do cliente:', err);
    res.status(500).json({ mensagem: 'Erro interno no servidor ao carregar sessão.' });
  }
});

// LISTAR CLIENTES QUE POSSUEM ORDENS DE SERVIÇO
app.get('/registros_Clientes_Com_OS', async (req, res) => {
  try {
    const clienteIdsComOS = await OrdemServico.distinct('clienteId');

    const idsBusca = clienteIdsComOS.map(id => {
      const num = Number(id);
      return isNaN(num) ? id : num;
    });

    const clientes = await Cliente.find({
      $or: [
        { customId: { $in: idsBusca } },
        { customId: { $in: clienteIdsComOS } },
        { _id: { $in: clienteIdsComOS.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
      ]
    }).sort({ nome: 1 });

    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes com OS:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes com OS' });
  }
});

// EXCLUIR APENAS AS ORDENS DE SERVIÇO DE UM CLIENTE (MANTÉM O CLIENTE NO BANCO)
app.delete('/excluir_Ordens_Cliente/:clienteId', async (req, res) => {
  try {
    const rawId = req.params.clienteId;
    const numId = !isNaN(Number(rawId)) ? Number(rawId) : null;

    const idsParaExcluir = [rawId, String(rawId)];
    if (numId !== null) idsParaExcluir.push(numId);

    const resultado = await OrdemServico.deleteMany({
      clienteId: { $in: idsParaExcluir }
    });

    res.json({
      message: 'Sessão de Ordens de Serviço excluída com sucesso!',
      deletados: resultado.deletedCount
    });
  } catch (error) {
    console.error('Erro ao excluir ordens do cliente:', error);
    res.status(500).json({ message: 'Erro ao encerrar sessão de ordens do cliente' });
  }
});

// OBTER OS ESPECÍFICA POR ID
app.get('/obter_os/:id', async (req, res) => {
  try {
    const osId = req.params.id;
    const os = await OrdemServico.findById(osId);

    if (!os) {
      return res.status(404).json({ mensagem: 'Ordem de Serviço não encontrada.' });
    }

    res.json(os);
  } catch (err) {
    console.error('Erro ao buscar OS:', err);
    res.status(500).json({ mensagem: 'Erro ao buscar dados da OS.' });
  }
});

// ATUALIZAR DADOS E SITUAÇÃO DA ORDEM DE SERVIÇO
app.put('/atualizar_os/:id', async (req, res) => {
  try {
    const { 
      equipamento, 
      marcaModelo, 
      numeroSerie, 
      patrimonio, 
      dataEntrada, 
      dataSaida, 
      tempoGarantia, 
      garantiaServicoAnterior, 
      garantiaCompra, 
      defeito, 
      servicoRealizar, 
      situacao, 
      pecas, 
      valorMaoObra, 
      valorTotal 
    } = req.body;

    const osAtualizada = await OrdemServico.findByIdAndUpdate(
      req.params.id,
      { 
        equipamento, 
        marcaModelo, 
        numeroSerie, 
        patrimonio, 
        dataEntrada, 
        dataSaida, 
        tempoGarantia, 
        garantiaServicoAnterior, 
        garantiaCompra, 
        defeito, 
        servicoRealizar, 
        situacao, 
        pecas, 
        valorMaoObra, 
        valorTotal 
      },
      { new: true }
    );

    if (!osAtualizada) {
      return res.status(404).json({ mensagem: 'Ordem de serviço não encontrada.' });
    }

    res.json({ mensagem: 'OS atualizada com sucesso!', os: osAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar OS:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar Ordem de Serviço.' });
  }
});
