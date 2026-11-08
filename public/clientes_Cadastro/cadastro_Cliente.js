const botao_cadastrar_Cliente = document.getElementById('cadastrarCliente');
botao_cadastrar_Cliente.addEventListener('click', abrir_Modal);

function abrir_Modal(){
    carregarSelectEstados();
    
    // Limpa os campos do formulário para evitar herdar dados antigos
    const inputs = document.querySelectorAll('#formulario_Modal input, #formulario_Modal select');
    inputs.forEach(input => input.value = '');
    
    document.getElementById('modal').classList.add('active');
}

// Lista dos 27 estados em JS
const ESTADOS_BRASIL = [
    { uf: 'AC', nome: 'Acre' }, { uf: 'AL', nome: 'Alagoas' }, { uf: 'AP', nome: 'Amapá' },
    { uf: 'AM', nome: 'Amazonas' }, { uf: 'BA', nome: 'Bahia' }, { uf: 'CE', nome: 'Ceará' },
    { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' }, { uf: 'GO', nome: 'Goiás' },
    { uf: 'MA', nome: 'Maranhão' }, { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' }, { uf: 'PB', nome: 'Paraíba' },
    { uf: 'PR', nome: 'Paraná' }, { uf: 'PE', nome: 'Pernambuco' }, { uf: 'PI', nome: 'Piauí' },
    { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' }, { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'RO', nome: 'Rondônia' }, { uf: 'RR', nome: 'Roraima' }, { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'São Paulo' }, { uf: 'SE', nome: 'Sergipe' }, { uf: 'TO', nome: 'Tocantins' }
];

function carregarSelectEstados() {
    const select = document.getElementById('estado');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione o Estado...</option>';
    ESTADOS_BRASIL.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.uf;
        opt.textContent = `${e.nome} (${e.uf})`;
        select.appendChild(opt);
    });
}

const botao_Salvar = document.getElementById('salvar');
botao_Salvar.addEventListener('click', salvar_Banco);

async function salvar_Banco(event){
    event.preventDefault();
    
    const dadosModal = {
        nome: document.getElementById('nome').value.trim(),
        cpf_cnpj: document.getElementById('cpf_cnpj').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        celular: document.getElementById('celular').value.trim(),
        email: document.getElementById('email').value.trim(),
        rua: document.getElementById('rua').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        bairro: document.getElementById('bairro').value.trim(),
        cidade: document.getElementById('cidade').value.trim(),
        estado: document.getElementById('estado').value.trim(),
        cep: document.getElementById('cep').value.trim()
    }

    if (!dadosModal.nome || !dadosModal.cpf_cnpj || !dadosModal.celular || !dadosModal.cidade ){
        alert('Preencha todos os campos obrigatórios!');
        return;
    }

    try {
        const resposta = await fetch('/salvar_Cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(dadosModal)
        });

        const data = await resposta.json();

        if (resposta.ok) {
            alert(data.message);
            location.reload();
        } else if (resposta.status === 409) {
            alert('Este Cliente já está cadastrado.');
        } else {
            alert('Erro ao salvar: ' + data.message);
        }

    } catch (error) {
        alert('Erro na comunicação com o servidor.');
        console.error(error);
    }
}

async function carregarDadosGeral() {
    try {
        const resposta = await fetch('/registros_Cliente');
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
        
        // CORRIGIDO: Vinculando todas as funções exclusivamente ao item.customId para bater com as rotas do back-end
        tr.innerHTML = `
            <td>${item.customId}</td>
            <td>${item.nome || ''}</td>
            <td>${item.cidade || ''}</td>
            <td>${item.celular || ''}</td>
            <td>${criadoEm}</td>
            <td>
                <span class="icon" onclick="verDetalhesCliente('${item.customId}')" title="Visualizar / Editar">👁️</span>
                <span class="icon" onclick="iniciarEdicaoDireta(this, '${item.customId}')" title="Edição Rápida">✏️</span>
                <span class="icon" onclick="excluirRegistro('${item.customId}')" title="Excluir">🗑️</span>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function verDetalhesCliente(id) {
    window.location.href = `/detalhes_Cliente/detalhes_Cliente.html?id=${id}`;
}

function fecharModal() {
    document.getElementById('modal').classList.remove('active');
}

function iniciarEdicaoDireta(el, id) {
    const tr = el.closest('tr');
    const cells = tr.querySelectorAll('td');

    const nomeTd = cells[1];
    const cidadeTd = cells[2];
    const celularTd = cells[3];

    nomeTd.innerHTML = `<input class="form-control form-control-sm" id="edit-nome-${id}" value="${nomeTd.textContent}">`;
    cidadeTd.innerHTML = `<input class="form-control form-control-sm" id="edit-cidade-${id}" value="${cidadeTd.textContent}">`;
    celularTd.innerHTML = `<input class="form-control form-control-sm" id="edit-celular-${id}" value="${celularTd.textContent}">`;

    el.textContent = '💾';
    el.onclick = () => salvarEdicaoInline(id);
}

async function salvarEdicaoInline(id) {
    const nome = document.getElementById(`edit-nome-${id}`).value.trim();
    const cidade = document.getElementById(`edit-cidade-${id}`).value.trim();
    const celular = document.getElementById(`edit-celular-${id}`).value.trim();

    try {
        const res = await fetch(`/atualizar_Cliente/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cidade, celular })
        });

        if (res.ok) carregarDadosGeral();
        else alert('Erro ao salvar edição inline');
    } catch (err) {
        console.error('Erro ao atualizar registro:', err);
    }
}

async function excluirRegistro(id) {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
        const res = await fetch(`/excluir_Cliente/${id}`, { method: 'DELETE' });
        if (res.ok) carregarDadosGeral();
        else alert('Erro ao excluir registro');
    } catch (err) {
        console.error('Erro ao excluir registro:', err);
    }
}

function pesquisando_Dados() {
    const filtro = document.getElementById('pesquisar').value.toLowerCase();
    const linhas = document.querySelectorAll('#corpo-tabela tr');

    const linhaMensagem = document.getElementById('linha-vazia');
    if (linhaMensagem) linhaMensagem.remove();

    let encontrou = false;

    linhas.forEach(tr => {
        if (tr.id === 'linha-vazia') return;
        const nome = tr.cells[1].textContent.toLowerCase();
        const cidade = tr.cells[2].textContent.toLowerCase();
        const celular = tr.cells[3].textContent.toLowerCase();
        const criadoEm = tr.cells[4].textContent.toLowerCase();

        const corresponde =
            nome.includes(filtro) ||
            cidade.includes(filtro) ||
            celular.includes(filtro) ||
            criadoEm.includes(filtro);

        tr.style.display = corresponde ? '' : 'none';
        if (corresponde) encontrou = true;
    });

    if (!encontrou) {
        const tbody = document.getElementById('corpo-tabela');
        const tr = document.createElement('tr');
        tr.id = 'linha-vazia';
        tr.classList.add('mensagem-vazia');
        tr.innerHTML = `<td colspan="6">Nenhum registro encontrado.</td>`;
        tbody.appendChild(tr);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosGeral();
    
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