const botao_Gerar_Os = document.getElementById('gerar_OS');

botao_Gerar_Os.addEventListener('click', gerar_Ordem);

function gerar_Ordem(){
    window.location.href = '../Os_Cliente/Os_Cliente.html'
}

async function carregarClientesComOS() {
    try {
        const resposta = await fetch('/registros_Clientes_Com_OS');
        const clientes = await resposta.json();
        renderizarTabela(clientes);
    } catch (err) {
        console.error('Erro ao carregar dados:', err);
    }
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpo-tabela');
    if (!corpo) return;
    corpo.innerHTML = '';

    dados.forEach(item => {
        const tr = document.createElement('tr');
        const criadoEm = item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
        
        tr.innerHTML = `
            <td>${item.customId}</td>
            <td class="cliente-link" onclick="abrirSessaoCliente('${item.customId}')" title="Clique para abrir a sessão do cliente">${item.nome || ''}</td>
            <td>${item.cidade || ''}</td>
            <td>${item.celular || ''}</td>
            <td>${criadoEm}</td>
            <td>
                <span class="icon" onclick="abrirSessaoCliente('${item.customId}')" title="Ver Histórico de OS">👁️</span>
                <span class="icon" onclick="excluirRegistro('${item.customId}')" title="Excluir">🗑️</span>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function abrirSessaoCliente(clienteId) {
    // Redireciona para a página de sessão do cliente
    window.location.href = `../sessao_Cliente/sessao_Cliente.html?id=${clienteId}`;
}

async function excluirRegistro(id) {
    if (!confirm('Deseja realmente excluir este cliente e suas ordens?')) return;
    try {
        const res = await fetch(`/excluir_Cliente/${id}`, { method: 'DELETE' });
        if (res.ok) carregarClientesComOS();
        else alert('Erro ao excluir registro');
    } catch (err) {
        console.error('Erro ao excluir registro:', err);
    }
}

function pesquisando_Dados() {
    const filtro = document.getElementById('pesquisar').value.toLowerCase();
    const linhas = document.querySelectorAll('#corpo-tabela tr');

    linhas.forEach(tr => {
        const nome = tr.cells[1]?.textContent.toLowerCase() || '';
        const cidade = tr.cells[2]?.textContent.toLowerCase() || '';
        const celular = tr.cells[3]?.textContent.toLowerCase() || '';

        const corresponde = nome.includes(filtro) || cidade.includes(filtro) || celular.includes(filtro);
        tr.style.display = corresponde ? '' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    carregarClientesComOS();

    const inputPesquisar = document.getElementById('pesquisar');
    if (inputPesquisar) {
        inputPesquisar.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                pesquisando_Dados();
            }
        });
    }
});

function confirmaSaida() {
    if (confirm('Deseja voltar?')) {
        window.location.href = '../inicio/logado.html';
    }
    return false;
}

fetch('/verificar_sessao_administrador')
  .then(res => res.json())
  .then(data => {
    if (!data.logado) {
      alert('Você precisa estar logado como administrador!');
      window.location.href = '../administrador_Login/administrador_Login.html';
    } else {
      const nav = document.querySelector('.navbar .container-fluid') || document.querySelector('.navbar .container-luid');
      if (nav) {
          const bemVindo = document.createElement('span');
          bemVindo.classList.add('navbar-text', 'ms-3');
          bemVindo.textContent = `Bem-vindo(a), ${data.nome}`;
          nav.appendChild(bemVindo);
      }
    }
  });

  async function excluirRegistro(id) {
    if (!confirm('Deseja realmente encerrar e excluir o histórico de Ordens de Serviço deste cliente? (O cadastro do cliente será mantido).')) return;
    try {
        // Agora chama a rota de exclusão apenas das Ordens de Serviço
        const res = await fetch(`/excluir_Ordens_Cliente/${id}`, { method: 'DELETE' });
        if (res.ok) {
            carregarClientesComOS(); // Atualiza a tabela (o cliente sairá da lista de clientes com OS)
        } else {
            alert('Erro ao excluir histórico de OS do cliente');
        }
    } catch (err) {
        console.error('Erro ao excluir histórico:', err);
    }
}