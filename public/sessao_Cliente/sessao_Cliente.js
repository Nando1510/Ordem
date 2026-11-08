// Função principal para buscar e carregar os dados atualizados da sessão
async function carregarSessaoCliente() {
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('id');

    if (!clienteId) {
        alert('Cliente não especificado!');
        window.location.href = 'ordens_Servico.html';
        return;
    }

    try {
        // Busca os dados do cliente e suas ordens de serviço (sempre dados atualizados do banco)
        const res = await fetch(`/obter_sessao_cliente/${clienteId}`, { cache: 'no-store' });
        const data = await res.json();

        if (data.cliente) {
            const titulo = document.getElementById('titulo-cliente');
            if (titulo) {
                titulo.textContent = `Sessão do Cliente: ${data.cliente.nome}`;
            }
        }

        const tbody = document.getElementById('corpo-tabela-os');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (data.ordens && data.ordens.length > 0) {
            data.ordens.forEach(os => {
                const tr = document.createElement('tr');
                const dataEmissao = os.createdAt 
                    ? new Date(os.createdAt).toLocaleDateString('pt-BR') 
                    : new Date().toLocaleDateString('pt-BR');
                
                // Define a classe da badge do Bootstrap de acordo com a situação
                const badgeClass = obterClasseBadge(os.situacao);

                tr.innerHTML = `
                    <td>${os.numeroOS || '---'}</td>
                    <td>${dataEmissao}</td>
                    <td><span class="badge ${badgeClass}">${os.situacao || 'Em andamento'}</span></td>
                    <td>
                        <span class="icon" onclick="visualizarOS('${os._id}')" style="cursor: pointer;" title="Abrir/Editar Ordem de Serviço">👁️</span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma Ordem de Serviço encontrada para este cliente.</td></tr>';
        }

    } catch (err) {
        console.error('Erro ao carregar sessão do cliente:', err);
    }
}

// Retorna a cor da tag/badge de situação
function obterClasseBadge(situacao) {
    switch (situacao) {
        case 'Concluído':
            return 'bg-success';          // Verde
        case 'Aguardando peça':
            return 'bg-danger';           // Vermelho
        case 'Aprovado':
            return 'bg-info text-dark';    // Azul claro
        case 'Cancelado':
            return 'bg-secondary';        // Cinza
        case 'Em andamento':
        default:
            return 'bg-warning text-dark'; // Amarelo
    }
}

// Redireciona para o formulário de edição da OS
function visualizarOS(osId) {
    window.location.href = `visualizar_OS.html?id=${osId}`;
}

// Evento disparado quando a página carrega OU quando o usuário volta do botão "Voltar"
window.addEventListener('pageshow', (event) => {
    carregarSessaoCliente();
});


const botao_Sair = document.getElementById('sair');
botao_Sair.addEventListener('click', sair);

function sair() {
    if (confirm('Deseja voltar?')) {
        window.location.href = '../ordens_Servico/ordens_Servico.html';
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