const botao_Enviar = document.getElementById('form-login');

// SEMPRE QUE FOR FORMULÁRIO O EVENTO É SUBMIT
botao_Enviar.addEventListener('submit', logar_Administrador); 

// PREVINE O ENVIO PADRÃO DO FORMULÁRIO
async function logar_Administrador(event) {
  event.preventDefault(); 

  const nome = document.getElementById('nome').value.trim();
  const senha = document.getElementById('senha').value.trim();

  if (!nome || !senha) {
    alert('Por favor, preencha todos os campos!');
    return;
  }

  try {
    const resposta = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha })
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      // Redireciona para a tela protegida
      window.location.href = '../inicio/logado.html';; 
    } else {
      alert(resultado.message || 'Usuário ou senha incorretos!');
    }

  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro ao tentar fazer login. Tente novamente mais tarde.');
  }
}