document.addEventListener('DOMContentLoaded', () => {
    // Carrega a sessão do usuário no topo
    verificarSessao();
    // Puxa lista de produtos do banco de dados
    carregarProdutosDoBanco();
});

const inputProduto = document.getElementById('produto');
const inputPreco = document.getElementById('preco');
const inputQuantidade = document.getElementById('quantidade');
const datalistProdutos = document.getElementById('lista_produtos_db');

const chkCpf = document.getElementById('chk_cpf');
const containerCpf = document.getElementById('container_cpf');
const inputCpf = document.getElementById('cpf_cliente');

const btnSalvar = document.getElementById('salvar');
const btnCancelar = document.getElementById('cancelar');
const btnFinalizar = document.getElementById('btn_finalizar_compra');

let idCounter = 1;
let arrayCarrinho = [];
let editId = null;
let bancoProdutosCache = []; // Guarda os produtos recebidos do backend

// ==========================================
// 1. CARREGAR PRODUTOS E PREENCHIMENTO AUTOMÁTICO
// ==========================================
async function carregarProdutosDoBanco() {
    try {
        const resposta = await fetch('/buscar_Produtos?termo=');
        bancoProdutosCache = await resposta.json();
        
        // Ordena em ordem alfabética pela descrição
        bancoProdutosCache.sort((a, b) => a.descricao.localeCompare(b.descricao));

        datalistProdutos.innerHTML = '';
        bancoProdutosCache.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.descricao;
            datalistProdutos.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar produtos do banco:', error);
    }
}

// Ao selecionar/digitar o produto, busca o valor de venda no cache do banco
inputProduto.addEventListener('input', () => {
    const nomeDigitado = inputProduto.value.trim();
    const produtoEncontrado = bancoProdutosCache.find(p => p.descricao.toLowerCase() === nomeDigitado.toLowerCase());

    if (produtoEncontrado) {
        // Preenche o valor de venda vindo do banco automaticamente
        inputPreco.value = parseFloat(produtoEncontrado.preco_venda || 0).toFixed(2);
    } else {
        inputPreco.value = '';
    }
});

// ==========================================
// 2. CONTROLE DO CPF E MÁSCARA BÁSICA
// ==========================================
chkCpf.addEventListener('change', () => {
    if (chkCpf.checked) {
        containerCpf.style.display = 'flex';
        inputCpf.focus();
    } else {
        containerCpf.style.display = 'none';
        inputCpf.value = '';
    }
});

inputCpf.addEventListener('input', () => {
    inputCpf.value = inputCpf.value.replace(/\D/g, '').slice(0, 11);
});

// ==========================================
// 3. CARRINHO DE COMPRAS (ADICIONAR / LISTAR)
// ==========================================
btnSalvar.addEventListener('click', () => {
    const nome = inputProduto.value.trim();
    const precoVal = parseFloat(inputPreco.value);
    const qtdVal = parseInt(inputQuantidade.value);

    if (!nome) {
        alert('Por favor, selecione um produto.');
        return;
    }
    if (isNaN(precoVal) || precoVal <= 0) {
        alert('Produto sem preço válido cadastrado.');
        return;
    }
    if (isNaN(qtdVal) || qtdVal <= 0) {
        alert('Informe uma quantidade válida.');
        return;
    }

    // Busca o produto real no cache carregado do banco de dados
    const produtoEncontrado = bancoProdutosCache.find(p => p.descricao.toLowerCase() === nome.toLowerCase());

    const itemObj = {
        id: editId !== null ? editId : idCounter++,
        // Armazena as referências reais do banco para o backend dar a baixa correta no estoque:
        produtoDbId: produtoEncontrado ? produtoEncontrado._id : null,
        customId: produtoEncontrado ? produtoEncontrado.customId : null,
        nomeProduto: nome,
        preco: precoVal,
        qtd: qtdVal,
        total: precoVal * qtdVal
    };

    if (editId === null) {
        arrayCarrinho.push(itemObj);
    } else {
        const index = arrayCarrinho.findIndex(item => item.id === editId);
        if (index !== -1) arrayCarrinho[index] = itemObj;
        editId = null;
        btnSalvar.innerText = 'Salvar no Carrinho';
    }

    limparCamposForm();
    listarTabela();
    atualizarTotalCompras();
});

btnCancelar.addEventListener('click', limparCamposForm);

function limparCamposForm() {
    inputProduto.value = '';
    inputPreco.value = '';
    inputQuantidade.value = '';
    editId = null;
    btnSalvar.innerText = 'Salvar no Carrinho';
}

function listarTabela() {
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';

    arrayCarrinho.forEach(item => {
        const linha = tbody.insertRow();
        linha.insertCell().innerText = item.id;
        linha.insertCell().innerText = item.nomeProduto;
        linha.insertCell().innerText = item.qtd;
        linha.insertCell().innerText = item.total.toFixed(2);

        const celulaAcoes = linha.insertCell();
        
        const imgEdit = document.createElement('img');
        imgEdit.src = 'img/edit.png';
        imgEdit.classList.add('action-icons');
        imgEdit.onclick = () => {
            editId = item.id;
            inputProduto.value = item.nomeProduto;
            inputPreco.value = item.preco.toFixed(2);
            inputQuantidade.value = item.qtd;
            btnSalvar.innerText = 'Atualizar';
        };

        const imgDelete = document.createElement('img');
        imgDelete.src = 'img/delete.png';
        imgDelete.classList.add('action-icons');
        imgDelete.onclick = () => {
            if (confirm(`Deseja remover o item ${item.nomeProduto} do carrinho?`)) {
                arrayCarrinho = arrayCarrinho.filter(i => i.id !== item.id);
                listarTabela();
                atualizarTotalCompras();
            }
        };

        celulaAcoes.appendChild(imgEdit);
        celulaAcoes.appendChild(imgDelete);
    });
}

function atualizarTotalCompras() {
    const total = arrayCarrinho.reduce((acc, curr) => acc + curr.total, 0);
    document.getElementById('total-compras').innerText = `Total das compras: R$ ${total.toFixed(2)}`;
}

// ==========================================
// 4. FINALIZAR COMPRA, BAIXA DE ESTOQUE E PDF
// ==========================================
btnFinalizar.addEventListener('click', async () => {
    if (arrayCarrinho.length === 0) {
        alert('O carrinho de compras está vazio!');
        return;
    }

    if (chkCpf.checked && inputCpf.value.length !== 11) {
        alert('Por favor, digite um CPF válido com 11 dígitos.');
        return;
    }

    const confirmar = confirm('Confirma a finalização desta compra?');
    if (!confirmar) return;

    // Calcula o valor total do carrinho
    const totalCompra = arrayCarrinho.reduce((acc, item) => acc + item.total, 0);

    // Mapeia os itens enviando as propriedades corretas do produto no banco
    const itensParaEnvio = arrayCarrinho.map(item => ({
        id: item.produtoDbId || item.customId, // ID real no MongoDB ou customId numérico do produto
        customId: item.customId,
        nomeProduto: item.nomeProduto,
        descricao: item.nomeProduto,
        preco: item.preco,
        qtd: item.qtd
    }));

    try {
        const resposta = await fetch('/finalizar_Venda', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                itens: itensParaEnvio,
                total: totalCompra,
                formaPagamento: 'Dinheiro',
                cpf: chkCpf.checked ? inputCpf.value : null
            })
        });

        if (resposta.ok) {
            // Emite o PDF da Nota Fiscal
            gerarPDFNotaFiscal();

            alert('Compra finalizada com sucesso! A Nota Fiscal foi gerada.');
            
            // Limpa o estado
            arrayCarrinho = [];
            listarTabela();
            atualizarTotalCompras();
            limparCamposForm();
            chkCpf.checked = false;
            containerCpf.style.display = 'none';
            inputCpf.value = '';
            carregarProdutosDoBanco(); // Atualiza estoque em memória
        } else {
            const data = await resposta.json();
            alert('Erro ao dar baixa no estoque: ' + (data.mensagem || data.message || 'Erro desconhecido.'));
        }
    } catch (err) {
        console.error("Erro na comunicação com o servidor:", err);
        alert('Erro ao comunicar com o servidor.');
    }
});

// FUNÇÃO PARA EMISSÃO DO PDF VIA JSPDF
function gerarPDFNotaFiscal() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const agora = new Date();
    const dataHoraStr = agora.toLocaleString('pt-BR');

    // Cabeçalho
    doc.setFontSize(18);
    doc.text("Rocha Solidez Ordens de Serviços 🧰", 14, 20);
    doc.setFontSize(12);
    doc.text("COMPROVANTE DE VENDA / NOTA FISCAL", 14, 28);
    doc.line(14, 32, 196, 32);

    // Detalhes
    doc.setFontSize(10);
    doc.text(`Data/Hora: ${dataHoraStr}`, 14, 40);
    
    if (chkCpf.checked && inputCpf.value) {
        const cpfFormatado = inputCpf.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        doc.text(`CPF do Cliente: ${cpfFormatado}`, 14, 46);
    } else {
        doc.text("CPF do Cliente: Não informado", 14, 46);
    }

    // Tabela de Produtos
    const colunas = ["ID", "Produto", "Qtd", "Preço Unit. (R$)", "Total (R$)"];
    const linhas = arrayCarrinho.map(item => [
        item.id,
        item.nomeProduto,
        item.qtd,
        item.preco.toFixed(2),
        item.total.toFixed(2)
    ]);

    doc.autoTable({
        startY: 52,
        head: [colunas],
        body: linhas,
        theme: 'striped',
        headStyles: { fillColor: [20, 147, 220] }
    });

    const valorTotalGeral = arrayCarrinho.reduce((acc, curr) => acc + curr.total, 0);
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`VALOR TOTAL DA COMPRA: R$ ${valorTotalGeral.toFixed(2)}`, 14, finalY);

    // Abre/Baixa o PDF no navegador
    doc.save(`Nota_Fiscal_${Date.now()}.pdf`);
}

// Funções de Sessão e Troca de Tela
function verificarSessao() {
    fetch('/verificar_sessao_administrador')
        .then(res => res.json())
        .then(data => {
            if (!data.logado) {
                alert('Você precisa estar logado como usuário!');
                window.location.href = '../login/login.html';
            } else {
                const el = document.getElementById('nome_Administrador');
                if (el) el.textContent = `Bem-vindo(a), ${data.nome}`;
            }
        })
        .catch(err => console.error(err));
}

function voltar_Pagina() {
    if (confirm('Deseja realmente voltar para a página de início?')) {
        window.location.href = '../inicio/logado.html';
    }
}