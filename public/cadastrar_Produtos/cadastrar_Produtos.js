document.addEventListener('DOMContentLoaded', () => {
    
    // Referências do DOM
    const btnAdicionar = document.getElementById('btn-adicionar');
    const formulario = document.getElementById('form-produto');

    const inputPesquisa = document.getElementById('pesquisar_produto');
    const setaDropdown = document.getElementById('seta_dropdown');
    const dropdownProdutos = document.getElementById('dropdown_produtos');
    const inputIdOculto = document.getElementById('produto_id');

    const checkCadastrarNovo = document.getElementById('check_cadastrar_novo');

    const inputDescricao = document.getElementById('descricao');
    const inputQtdAdicionar = document.getElementById('qtd_adicionar');
    const inputQtdAtual = document.getElementById('qtd_atual');
    const inputPrecoCompra = document.getElementById('preco_compra');
    const inputPrecoUnitario = document.getElementById('preco_unitario');
    const inputPrecoVenda = document.getElementById('preco_venda');
    const inputEstoqueMinimo = document.getElementById('estoque_minimo');

    const demaisInputs = [
        inputQtdAdicionar,
        inputQtdAtual,
        inputPrecoUnitario,
        inputPrecoVenda,
        inputEstoqueMinimo
    ];

    let cacheProdutos = [];

    // 1. VERIFICAÇÃO DE SESSÃO
    fetch('/verificar_sessao_administrador')
        .then(res => res.json())
        .then(data => {
            if (!data.logado) {
                alert('Você precisa estar logado como usuário!');
                window.location.href = '../login/login.html';
            } else {
                const elementoNome = document.getElementById('nome_Administrador');
                if (elementoNome) {
                    elementoNome.textContent = `Bem-vindo(a), ${data.nome}`;
                }
            }
        })
        .catch(err => console.error('Erro ao verificar sessão:', err));

    // 2. ALTERNÂNCIA DOS CAMPOS PELO CHECKBOX
    function aplicarEstadoCampos() {
        const estaMarcado = checkCadastrarNovo ? checkCadastrarNovo.checked : false;

        if (estaMarcado) {
            // Cadastrando novo produto: habilita a descrição e habilita os demais campos para entrada inicial
            inputDescricao.disabled = false;
            demaisInputs.forEach(input => { if (input) input.disabled = false; });
            inputIdOculto.value = ""; // Garante que não há ID vinculado
        } else {
            // Editando/Adicionando a produto existente
            inputDescricao.disabled = true;
            demaisInputs.forEach(input => { if (input) input.disabled = false; });
        }

        inputPrecoCompra.disabled = true;
        inputPrecoCompra.readOnly = true;
    }

    if (checkCadastrarNovo) {
        checkCadastrarNovo.addEventListener('change', () => {
            if (checkCadastrarNovo.checked) {
                resetarParaModoCadastro();
                checkCadastrarNovo.checked = true; // Mantém marcado após reset
                aplicarEstadoCampos();
            } else {
                aplicarEstadoCampos();
            }
        });
    }

    aplicarEstadoCampos();

    // 3. CÁLCULO DE PREÇO TOTAL DE COMPRA
    function calcularPrecoTotal() {
        const qtdAdicionar = parseFloat(inputQtdAdicionar.value) || 0;
        const precoUnitario = parseFloat(inputPrecoUnitario.value) || 0;

        if (qtdAdicionar > 0 && precoUnitario > 0) {
            const total = qtdAdicionar * precoUnitario;
            inputPrecoCompra.value = total.toFixed(2);
        } else {
            inputPrecoCompra.value = "0.00";
        }
    }

    inputQtdAdicionar.addEventListener('input', calcularPrecoTotal);
    inputPrecoUnitario.addEventListener('input', calcularPrecoTotal);

    // 4. DROPDOWN DE BUSCA
    function renderizarDropdown(produtos) {
        dropdownProdutos.innerHTML = '';
        
        if (produtos.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Nenhum produto encontrado.';
            li.style.color = '#999';
            li.style.cursor = 'default';
            dropdownProdutos.appendChild(li);
            return;
        }

        produtos.forEach(prod => {
            const li = document.createElement('li');
            li.textContent = prod.descricao;
            
            li.addEventListener('click', () => {
                inputPesquisa.value = prod.descricao;
                carregarDadosProduto(prod);
                fecharDropdown();
            });

            dropdownProdutos.appendChild(li);
        });
    }

    async function atualizarListaEExibir(termo = '') {
        try {
            const resposta = await fetch(`/buscar_Produtos?termo=${encodeURIComponent(termo)}`);
            cacheProdutos = await resposta.json();
            renderizarDropdown(cacheProdutos);
            dropdownProdutos.style.display = 'block';
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
        }
    }

    function fecharDropdown() {
        dropdownProdutos.style.display = 'none';
    }

    if (setaDropdown) {
        setaDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdownProdutos.style.display === 'block') {
                fecharDropdown();
            } else {
                atualizarListaEExibir(''); 
            }
        });
    }

    if (inputPesquisa) {
        inputPesquisa.addEventListener('click', (e) => {
            e.stopPropagation();
            atualizarListaEExibir(inputPesquisa.value.trim());
        });

        inputPesquisa.addEventListener('input', () => {
            const termo = inputPesquisa.value.trim();
            atualizarListaEExibir(termo);

            if (termo === '') {
                resetarParaModoCadastro();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target !== inputPesquisa && e.target !== setaDropdown) {
            fecharDropdown();
        }
    });

    // 5. MODO DE EDIÇÃO VS NOVO CADASTRO
    function carregarDadosProduto(produto) {
        inputIdOculto.value = produto._id || "";
        inputDescricao.value = produto.descricao;
        inputQtdAdicionar.value = "0"; 
        
        inputQtdAtual.value = produto.qtd_atual || 0;
        inputQtdAtual.classList.add('form-control-readonly');
        inputQtdAtual.readOnly = true;

        inputPrecoUnitario.value = produto.preco_unitario ? parseFloat(produto.preco_unitario).toFixed(2) : "0.00";
        inputPrecoCompra.value = produto.preco_compra ? parseFloat(produto.preco_compra).toFixed(2) : "0.00";
        inputPrecoVenda.value = produto.preco_venda || 0;
        inputEstoqueMinimo.value = produto.estoque_minimo || 0;

        btnAdicionar.innerHTML = "💾 Atualizar";
        btnAdicionar.className = "btn-custom btn-update";

        if (checkCadastrarNovo) checkCadastrarNovo.checked = false;
        aplicarEstadoCampos();
    }

    function resetarParaModoCadastro() {
        inputIdOculto.value = "";
        formulario.reset();
        inputQtdAtual.classList.remove('form-control-readonly');
        inputQtdAtual.readOnly = false;
        inputPrecoCompra.value = "0.00";

        if (checkCadastrarNovo) checkCadastrarNovo.checked = false;
        aplicarEstadoCampos();

        btnAdicionar.innerHTML = "➕ Adicionar";
        btnAdicionar.className = "btn-custom btn-add";
    }

    // 6. ENVIO E VALIDAÇÃO DOS DADOS
    btnAdicionar.addEventListener('click', async (e) => {
        e.preventDefault();

        const ehNovoCadastro = checkCadastrarNovo && checkCadastrarNovo.checked;
        const descricaoDigitada = ehNovoCadastro ? inputDescricao.value.trim() : inputPesquisa.value.trim();

        // Validação de Duplicidade ao cadastrar novo
        if (ehNovoCadastro && descricaoDigitada !== "") {
            try {
                const resBusca = await fetch(`/buscar_Produtos?termo=${encodeURIComponent(descricaoDigitada)}`);
                const produtosExistentes = await resBusca.json();

                const jaExiste = produtosExistentes.some(p => 
                    p.descricao && p.descricao.trim().toLowerCase() === descricaoDigitada.toLowerCase()
                );

                if (jaExiste) {
                    alert('Esse produto já está cadastrado no banco.');
                    return;
                }
            } catch (err) {
                console.error("Erro ao verificar duplicidade:", err);
            }
        }

        const dadosProduto = {
            descricao: descricaoDigitada,
            qtd_adicionar: parseInt(inputQtdAdicionar.value) || 0,
            qtd_atual: parseInt(inputQtdAtual.value) || 0,
            preco_compra: parseFloat(inputPrecoCompra.value) || 0,
            preco_unitario: parseFloat(inputPrecoUnitario.value) || 0,
            preco_venda: parseFloat(inputPrecoVenda.value) || 0,
            estoque_minimo: parseInt(inputEstoqueMinimo.value) || 0
        };

        if (inputIdOculto.value) {
            dadosProduto._id = inputIdOculto.value;
        }

        // Validação de campos obrigatórios
        if (ehNovoCadastro && !dadosProduto.descricao) {
            alert('Por favor, informe a Descrição do produto a ser cadastrado.');
            return;
        }

        if (!dadosProduto.preco_venda || dadosProduto.preco_venda <= 0) {
            alert('Por favor, informe um Preço de Venda válido.');
            return;
        }

        if (dadosProduto.preco_venda > 0 && dadosProduto.preco_unitario > 0 && dadosProduto.preco_venda < dadosProduto.preco_unitario) {
            if (!confirm('Aviso: O preço de venda é inferior ao preço unitário de custo. Deseja continuar?')) return;
        }

        try {
            const resposta = await fetch('/salvar_Produto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosProduto)
            });

            const data = await resposta.json();

            if (resposta.ok) {
                alert(data.message || 'Produto salvo com sucesso!');
                resetarParaModoCadastro();
                if (inputPesquisa) inputPesquisa.value = '';
            } else {
                alert('Erro ao salvar no servidor: ' + (data.message || 'Erro desconhecido.'));
            }
        } catch (error) {
            alert('Erro na comunicação com o servidor. Certifique-se de que a aplicação backend está ativa.');
            console.error(error);
        }
    });

    // 7. BOTÃO VOLTAR
    const botaoVoltar = document.getElementById('voltar');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', () => {
            if (confirm('Deseja realmente voltar para a página inicial?')) {
                window.location.href = '../inicio/logado.html';
            }
        });
    }
});