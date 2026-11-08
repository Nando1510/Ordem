const botao_cadastrar_Administrador = document.getElementById('cadastrarAdministrador');
botao_cadastrar_Administrador.addEventListener('click', abrir_Modal);

function abrir_Modal(){
  document.getElementById('modal').style.display = "flex"
}

function fechar_Modal(){
  const confirma = confirm('Deseja realmente fechar essa tela?')
  if (confirma === true){
    document.getElementById('modal').style.display = "none";
    return;
  }
}

const botao_Cancelar = document.getElementById('cancelar');
botao_Cancelar.addEventListener('click', limpar_inputs_Modal);

function limpar_inputs_Modal(){
  document.getElementById('formulario_Modal').reset(); 
}

const botao_Salvar = document.getElementById('salvar');
botao_Salvar.addEventListener('click', salvar_Banco);

async function salvar_Banco(event) {
  event.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const confirmar_Senha = document.getElementById('confirmar_Senha').value.trim();
  const celular = document.getElementById('celular').value.trim();

  if (!nome || !senha || !confirmar_Senha || !celular) {
    alert('Preencha todos os campos!');
    return;
  }

  if (senha.length < 6 || confirmar_Senha.length < 6) {
    alert('Sua senha deve conter no mínimo 6 caracteres!');
    return;
  }

  if (senha !== confirmar_Senha) {
    alert('Senha e confirmação de senha não conferem!');
    return;
  }

  try {
    const resposta = await fetch('/salvar_Administrador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha, celular })
    });

    const data = await resposta.json();

    

    if (resposta.ok) {
      alert(data.message);
      limpar_inputs_Modal();
      location.reload();
    } else if (resposta.status === 409) {
      alert('Este nome de administrador já está cadastrado. Escolha outro.');
    } else {
      alert('Erro ao salvar: ' + data.message);
    }
  } catch (error) {
    alert('Erro na comunicação com o servidor.');
    console.error(error);
  }
}

function pesquisando_Dados() {
  const filtro = document.getElementById('pesquisar').value.toLowerCase();
  const linhas = document.querySelectorAll('#corpo-tabela tr');

  const linhaMensagem = document.getElementById('linha-vazia');
  if (linhaMensagem) linhaMensagem.remove();

  let encontrou = false;

  linhas.forEach(tr => {
    const nome = tr.cells[1].textContent.toLowerCase();
    const corresponde = nome.includes(filtro);
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

document.getElementById('pesquisar')
  .addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      pesquisando_Dados();
    }
  });

// VERIFICA SE O ADMINISTRADOR ESTÁ LOGADO E EXIBE O NOME
fetch('/verificar_sessao_administrador')
  .then(res => res.json())
  .then(data => {
    if (!data.logado) {
      alert('Você precisa estar logado como administrador!');
      window.location.href = '../administrador_Login/administrador_Login.html';
    } else {
      const nav = document.querySelector('.navbar .container-fluid');
      const bemVindo = document.createElement('span');
      bemVindo.classList.add('navbar-text', 'ms-3');
      bemVindo.textContent = `Bem-vindo(a), ${data.nome}`;
      nav.appendChild(bemVindo);
    }
  });

// FAZ LOGOUT AO CLICAR EM SAIR
function confirmaSaida() {
    if (confirm('Deseja voltar?')) {
        window.location.href = '../inicio/logado.html';
    }
    return false;
}
