
       
       
       // Lista idêntica à do seu sistema para popular dinamicamente se necessário
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

        // Captura o ID vindo da URL (?id=X)
        const urlParams = new URLSearchParams(window.location.search);
        const clienteId = urlParams.get('id');

        let modoEdicao = false;

        const btnAcao = document.getElementById('btn-acao');
        const formulario = document.getElementById('form-detalhes');
        const inputs = formulario.querySelectorAll('input, select');

        // Inicialização da página
        document.addEventListener('DOMContentLoaded', () => {
            carregarSelectEstados();
            if (clienteId) {
                document.getElementById('label-id').textContent = clienteId;
                buscarDadosCliente(clienteId);
            } else {
                alert('ID do cliente inválido ou não informado.');
                window.location.href = 'cadastro_Cliente.html';
            }
        });

        function carregarSelectEstados() {
            const select = document.getElementById('estado');
            select.innerHTML = '<option value="">Selecione...</option>';
            ESTADOS_BRASIL.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.uf;
                opt.textContent = `${e.nome} (${e.uf})`;
                select.appendChild(opt);
            });
        }

        // Busca todos os dados do banco usando a rota GET do backend
        async function buscarDadosCliente(id) {
            try {
                const resposta = await fetch(`/buscar_Cliente/${id}`);
                if (!resposta.ok) throw new Error('Erro ao encontrar cliente.');
                
                const registro = await resposta.json();

                // Distribui os valores buscados nos inputs correspondentes
                document.getElementById('nome').value = registro.nome || '';
                document.getElementById('cpf_cnpj').value = registro.cpf_cnpj || '';
                document.getElementById('email').value = registro.email || '';
                document.getElementById('telefone').value = registro.telefone || '';
                document.getElementById('celular').value = registro.celular || '';
                document.getElementById('rua').value = registro.rua || '';
                document.getElementById('numero').value = registro.numero || '';
                document.getElementById('bairro').value = registro.bairro || '';
                document.getElementById('cidade').value = registro.cidade || '';
                document.getElementById('estado').value = registro.estado || '';
                document.getElementById('cep').value = registro.cep || '';
            } catch (err) {
                alert('Erro ao carregar os dados cadastrais.');
                console.error(err);
            }
        }

        // Controla o comportamento do botão alternador (Editar <-> Salvar)
        btnAcao.addEventListener('click', async () => {
            if (!modoEdicao) {
                // MUDAR PARA MODO EDIÇÃO
                modoEdicao = true;
                
                // Habilita todos os inputs para digitação
                inputs.forEach(input => input.disabled = false);
                
                // Transforma o botão visualmente em Salvar
                btnAcao.textContent = '💾 Salvar';
                btnAcao.classList.remove('btn-edit');
                btnAcao.classList.add('btn-save');
            } else {
                // EXECUTAR AÇÃO DE SALVAR NO BANCO
                
                // Validação básica dos campos required
                if(!document.getElementById('nome').value.trim() || 
                   !document.getElementById('cpf_cnpj').value.trim() || 
                   !document.getElementById('celular').value.trim() || 
                   !document.getElementById('cidade').value.trim()){
                    alert('Por favor, preencha todos os campos obrigatórios.');
                    return;
                }

                const dadosAtualizados = {
                    nome: document.getElementById('nome').value.trim(),
                    cpf_cnpj: document.getElementById('cpf_cnpj').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    telefone: document.getElementById('telefone').value.trim(),
                    celular: document.getElementById('celular').value.trim(),
                    rua: document.getElementById('rua').value.trim(),
                    numero: document.getElementById('numero').value.trim(),
                    bairro: document.getElementById('bairro').value.trim(),
                    cidade: document.getElementById('cidade').value.trim(),
                    estado: document.getElementById('estado').value.trim(),
                    cep: document.getElementById('cep').value.trim()
                };

                try {
                    const res = await fetch(`/atualizar_Cliente/${clienteId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dadosAtualizados)
                    });

                    if (res.ok) {
                        alert('Dados atualizados com sucesso!');
                        
                        // Volta para o modo de leitura (bloqueado)
                        modoEdicao = false;
                        inputs.forEach(input => input.disabled = true);
                        
                        btnAcao.textContent = '✏️ Editar';
                        btnAcao.classList.remove('btn-save');
                        btnAcao.classList.add('btn-edit');
                    } else {
                        alert('Erro ao salvar as modificações no banco de dados.');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Erro de comunicação com o servidor.');
                }
            }
        });

        // Limita o CPF a apenas números enquanto digita
        document.getElementById('cpf_cnpj').addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '');
        });

        function verDetalhesCliente(id) {
            // Redireciona para a nova página de detalhes passando o ID como parâmetro
            window.location.href = `detalhes_Cliente.html?id=${id}`;
        }


        const botao_Voltar = document.getElementById('voltar');

        botao_Voltar.addEventListener('click', voltar);

        function voltar(){
            const confirmar = confirm('Deseja realmente voltar para a página Cadastro de Clientes?');
            if (confirmar){
                window.location.href = '../clientes_Cadastro/cadastro_Cliente.html';
            }
        }
       