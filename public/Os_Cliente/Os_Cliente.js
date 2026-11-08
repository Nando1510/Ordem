/**
 * Gerenciamento do Formulário de Ordem de Serviço (Os_Cliente.js)
 * Rocha Solidez
 */

// Estado global da aplicação
let listaClientes = [];
let produtosCarregados = [];
let pecasAdicionadas = [];

// FUNÇÃO DE GERAÇÃO DE PDF USANDO O CONTAINER OCULTO DO HTML
const gerarPDFComContainerOculto = async (dados) => {
    const html2pdfLib = window.html2pdf || window.html2Pdf;
    if (!html2pdfLib) {
        console.error("A biblioteca html2pdf não foi encontrada no escopo global.");
        alert("Erro: A biblioteca de PDF não está disponível. Verifique a conexão com a internet ou o CDN.");
        return;
    }

    // 1. Preenche os campos de texto do container oculto
    document.getElementById('pdf-cliente').textContent = dados.nomeCliente;
    document.getElementById('pdf-cidade').textContent = dados.cidadeCliente;
    document.getElementById('pdf-equipamento').textContent = dados.equipamento;
    document.getElementById('pdf-marca').textContent = dados.marcaModelo;
    document.getElementById('pdf-serie').textContent = dados.numeroSerie;
    document.getElementById('pdf-patrimonio').textContent = dados.patrimonio;
    document.getElementById('pdf-data-entrada').textContent = dados.dataEntrada;
    document.getElementById('pdf-data-saida').textContent = dados.dataSaida;
    document.getElementById('pdf-garantia').textContent = dados.tempoGarantia;
    document.getElementById('pdf-defeito').textContent = dados.defeito;
    document.getElementById('pdf-servico').textContent = dados.servicoRealizar;
    document.getElementById('pdf-situacao').textContent = dados.situacao;
    document.getElementById('pdf-mao-obra').textContent = dados.valorMaoObra.toFixed(2);
    document.getElementById('pdf-total').textContent = dados.valorTotal;

    // 2. Preenche a tabela de peças dentro do container oculto
    const tbodyPdf = document.getElementById('pdf-tabela-pecas');
    if (tbodyPdf) {
        if (dados.pecas && dados.pecas.length > 0) {
            tbodyPdf.innerHTML = dados.pecas.map(p => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 6px;">${p.descricao}</td>
                    <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${p.quantidade}</td>
                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">R$ ${(p.valorUnitario || 0).toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">R$ ${(p.subtotal || 0).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            tbodyPdf.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 8px;">Nenhuma peça adicionada</td></tr>';
        }
    }

    // 3. Seleciona o elemento oculto do HTML
    const elementoOculto = document.getElementById('pdf-container-oculto');
    if (!elementoOculto) {
        console.warn("Container oculto de PDF não encontrado no DOM.");
        return;
    }

    // Exibe temporariamente fora da tela com dimensões consistentes
    elementoOculto.style.display = 'block';
    elementoOculto.style.position = 'absolute';
    elementoOculto.style.left = '-9999px';
    elementoOculto.style.top = '0';
    elementoOculto.style.width = '210mm';

    const opt = {
        margin: 10,
        filename: `Orcamento_${dados.nomeCliente.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await new Promise(resolve => setTimeout(resolve, 300));
        await html2pdfLib().set(opt).from(elementoOculto).save();
    } catch (err) {
        console.error("Erro crítico ao gerar PDF via html2pdf:", err);
        alert("Erro ao gerar o arquivo PDF. Verifique o console (F12).");
    } finally {
        elementoOculto.style.display = 'none';
        elementoOculto.style.position = '';
        elementoOculto.style.left = '';
        elementoOculto.style.top = '';
        elementoOculto.style.width = '';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Referências do DOM
    const formOS = document.getElementById('form-os');
    const selectCliente = document.getElementById('select-cliente');
    const containerCampos = document.getElementById('container-campos-os');
    const selectPeca = document.getElementById('select-peca');
    const qtdPecaInput = document.getElementById('qtd-peca');
    const btnAdicionarPeca = document.getElementById('btn-adicionar-peca');
    const btnEnviarOrcamento = document.getElementById('btn-enviar-orcamento');
    const dataEntradaInput = document.getElementById('data-entrada');
    const inputMaoDeObra = document.getElementById('valor-mao-obra');
    const botaoSair = document.getElementById('sair');
    const botaoCancelar = document.getElementById('cancelar');

    // Referências dos Spans de Informação Visual do Cliente
    const lblCpf = document.getElementById('lbl-cliente-cpf');
    const lblCidade = document.getElementById('lbl-cliente-cidade');
    const lblCelular = document.getElementById('lbl-cliente-celular');

    // Função utilitária para destravar totalmente a interface
    const liberarInterface = () => {
        if (containerCampos) {
            containerCampos.removeAttribute('disabled');
            containerCampos.disabled = false;
        }
        
        const elementosInterativos = document.querySelectorAll('button, input, select, textarea, fieldset');
        elementosInterativos.forEach(elem => {
            elem.removeAttribute('disabled');
            elem.disabled = false;
        });
    };

    // Garante que botões de controle fiquem ativos
    if (botaoSair) botaoSair.disabled = false;
    if (botaoCancelar) botaoCancelar.disabled = false;

    // Eventos de navegação e limpeza
    if (botaoSair) botaoSair.addEventListener('click', voltarPagina);
    if (botaoCancelar) botaoCancelar.addEventListener('click', limparFormulario);

    // Define data de entrada padrão
    if (dataEntradaInput && !dataEntradaInput.value) {
        dataEntradaInput.value = new Date().toISOString().split('T')[0];
    }

    // Atualiza totais em tempo real ao alterar valor da mão de obra
    if (inputMaoDeObra) {
        inputMaoDeObra.addEventListener('input', renderTabelaPecas);
    }

    // Inicialização
    verificarSessao();
    carregarClientesSelect();

    // Seleção de cliente atualizada com busca e preenchimento de labels
    if (selectCliente) {
        selectCliente.addEventListener('change', async () => {
            const clienteId = selectCliente.value;
            const clienteSelecionado = clienteId !== "";
            
            if (!clienteSelecionado) {
                if (lblCpf) lblCpf.textContent = '---';
                if (lblCidade) lblCidade.textContent = '---';
                if (lblCelular) lblCelular.textContent = '---';
                if (containerCampos) containerCampos.disabled = true;
                return;
            }

            if (containerCampos) {
                containerCampos.disabled = false;
            }

            liberarInterface();
            await carregarProdutosSelect();

            // Requisição para buscar os detalhes individuais do cliente (CPF, Cidade, Celular)
            try {
                const response = await fetch(`/buscar_Cliente/${clienteId}`);
                if (response.ok) {
                    const clienteData = await response.json();
                    if (lblCpf) lblCpf.textContent = clienteData.cpf_cnpj || 'Não informado';
                    if (lblCidade) lblCidade.textContent = clienteData.cidade || 'Não informada';
                    if (lblCelular) lblCelular.textContent = clienteData.celular || 'Não informado';
                } else {
                    console.warn("Não foi possível carregar os detalhes complementares do cliente.");
                }
            } catch (err) {
                console.error("Erro ao buscar detalhes do cliente selecionado:", err);
            }
        });
    }

    // Adicionar Peça à Lista
    if (btnAdicionarPeca) {
        btnAdicionarPeca.addEventListener('click', () => {
            const prodId = selectPeca ? selectPeca.value : "";
            const qtd = parseInt(qtdPecaInput ? qtdPecaInput.value : 1, 10) || 1;

            if (!prodId) {
                alert("Por favor, selecione uma peça primeiro.");
                return;
            }

            const produto = produtosCarregados.find(p => (p._id === prodId || p.customId === prodId));
            if (!produto) {
                alert("Peça não encontrada no estoque.");
                return;
            }

            const estoqueAtual = produto.qtd_atual ?? produto.quantidade ?? 0;
            const precoVenda = parseFloat(produto.preco_venda || produto.preco_unitario || produto.valor) || 0;

            if (qtd > estoqueAtual) {
                alert(`Atenção: A quantidade informada (${qtd}) excede o estoque disponível (${estoqueAtual}).`);
            }

            const idChave = String(produto._id || produto.customId || "ITEM_MANUAL");
            const indexExistente = pecasAdicionadas.findIndex(p => p.produtoId === idChave);

            if (indexExistente > -1) {
                pecasAdicionadas[indexExistente].quantidade += qtd;
                pecasAdicionadas[indexExistente].subtotal = pecasAdicionadas[indexExistente].quantidade * precoVenda;
            } else {
                pecasAdicionadas.push({
                    produtoId: idChave,
                    descricao: produto.descricao || produto.nome || "Item sem nome",
                    quantidade: qtd,
                    valorUnitario: precoVenda,
                    subtotal: qtd * precoVenda
                });
            }

            renderTabelaPecas();
            if (selectPeca) selectPeca.value = "";
            if (qtdPecaInput) qtdPecaInput.value = "1";
        });
    }

    const formatarData = (dataStr) => {
        if (!dataStr) return "Não informada";
        const partes = dataStr.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataStr;
    };

    // AÇÃO DO BOTÃO "ENVIAR ORÇAMENTO"
    if (btnEnviarOrcamento) {
        btnEnviarOrcamento.addEventListener('click', async function (e) {
            e.preventDefault();

            const clienteId = selectCliente ? selectCliente.value : "";
            if (!clienteId) {
                alert("Selecione um cliente para gerar o orçamento.");
                return;
            }

            const cliente = listaClientes.find(c => (c.customId || c._id) == clienteId);
            const nomeCliente = cliente ? cliente.nome : "Não informado";
            const cidadeCliente = cliente ? (cliente.cidade || "Não informada") : "Não informada";
            
            const equipamento = document.getElementById('equipamento')?.value || "Não informado";
            const marcaModelo = document.getElementById('marca-modelo')?.value || "Não informado";
            const numeroSerie = document.getElementById('numero-serie')?.value || "Não informado";
            const patrimonio = document.getElementById('patrimonio')?.value || "Não informado";

            const dataEntrada = formatarData(document.getElementById('data-entrada')?.value);
            const dataSaida = formatarData(document.getElementById('data-saida')?.value);
            const tempoGarantia = document.getElementById('tempo-garantia')?.value || "Não informado";
            
            const garantiaServicoAnterior = document.getElementById('garantia-servico-anterior')?.checked ? "Sim" : "Não";
            const garantiaCompra = document.getElementById('garantia-compra')?.checked ? "Sim" : "Não";

            const defeito = document.getElementById('defeito')?.value || "Não informado";
            const servicoRealizar = document.getElementById('servico-realizar')?.value?.trim() || "Não informado";
            const situacao = document.getElementById('situacao')?.value || "Em andamento";

            const valorMaoObra = parseFloat(document.getElementById('valor-mao-obra')?.value) || 0;
            const valorTotal = document.getElementById('valor-total')?.value || "0.00";

            let blocoPecas = "Nenhuma peça adicionada.\n";
            if (pecasAdicionadas.length > 0) {
                blocoPecas = "";
                pecasAdicionadas.forEach(p => {
                    blocoPecas += `• ${p.descricao} | Qtd: ${p.quantidade} x R$ ${(p.valorUnitario || 0).toFixed(2)} = R$ ${(p.subtotal || 0).toFixed(2)}\n`;
                });
            }

            const mensagemTexto = 
`Olá *${nomeCliente}*, aqui é da *Rocha Solidez*! 🛠️
Seguem os dados completos do seu Orçamento/Ordem de Serviço:

📌 *DADOS DO CLIENTE*
• *Cliente:* ${nomeCliente} (${cidadeCliente})

💻 *DADOS DO EQUIPAMENTO*
• *Equipamento:* ${equipamento}
• *Marca / Modelo:* ${marcaModelo}
• *Nº de Série:* ${numeroSerie}
• *Patrimônio:* ${patrimonio}

📅 *DATAS E GARANTIA*
• *Data de Entrada:* ${dataEntrada}
• *Data de Saída / Previsão:* ${dataSaida}
• *Tempo de Garantia:* ${tempoGarantia}
• *Garantia Serviço Anterior:* ${garantiaServicoAnterior}
• *Garantia de Compra:* ${garantiaCompra}

📝 *DIAGNÓSTICO E SERVIÇO*
• *Defeito / Relato:* ${defeito}
• *Serviço a Realizar / Obs:* ${servicoRealizar}
• *Situação:* ${situacao}

🔧 *PEÇAS / COMPONENTES*
${blocoPecas}
💰 *VALORES E TOTAL*
• *Mão de Obra:* R$ ${valorMaoObra.toFixed(2)}
• *VALOR TOTAL ESTIMADO:* R$ ${valorTotal}

Fico no aguardo de sua aprovação!`;

            const telefone = cliente ? (cliente.celular || cliente.telefone || "") : "";
            const foneLimpo = telefone.replace(/\D/g, "");

            // 1. ABRIR WHATSAPP
            if (foneLimpo) {
                const urlWa = `https://wa.me/55${foneLimpo}?text=${encodeURIComponent(mensagemTexto)}`;
                window.open(urlWa, '_blank');
            } else {
                alert("O cliente não possui número de WhatsApp cadastrado.");
            }

            // 2. GERAR PDF USANDO O CONTAINER OCULTO
            try {
                await gerarPDFComContainerOculto({
                    nomeCliente,
                    cidadeCliente,
                    equipamento,
                    marcaModelo,
                    numeroSerie,
                    patrimonio,
                    dataEntrada,
                    dataSaida,
                    tempoGarantia,
                    defeito,
                    servicoRealizar,
                    situacao,
                    pecas: pecasAdicionadas,
                    valorMaoObra,
                    valorTotal
                });
            } catch (err) {
                console.error("Erro ao gerar PDF:", err);
            } finally {
                liberarInterface();
            }
        });
    }

    // SALVAR ORDEM DE SERVIÇO (SUBMISSÃO DO FORMULÁRIO)
    if (formOS) {
        formOS.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!formOS.checkValidity()) {
                formOS.reportValidity();
                return;
            }

            const clienteId = selectCliente ? selectCliente.value : "";
            if (!clienteId) {
                alert('Selecione um cliente válido.');
                return;
            }

            const equipamentoInput = document.getElementById('equipamento')?.value?.trim();
            if (!equipamentoInput) {
                alert('O campo Equipamento é obrigatório.');
                return;
            }

            const pecasTratadas = pecasAdicionadas.map(p => ({
                produtoId: String(p.produtoId || p._id || p.customId || "ITEM_DIVERSO"),
                descricao: String(p.descricao || "Peça/Serviço"),
                quantidade: Number(p.quantidade) || 1,
                valorUnitario: Number(p.valorUnitario) || 0,
                subtotal: Number(p.subtotal) || 0
            }));

            const valorTotalRaw = document.getElementById('valor-total')?.value || "0";
            const valorTotalLimpo = parseFloat(
                valorTotalRaw.toString().replace(/[^\d.,]/g, '').replace(',', '.')
            ) || 0;

            const dadosOS = {
                clienteId: clienteId,
                equipamento: equipamentoInput,
                marcaModelo: document.getElementById('marca-modelo')?.value || "",
                numeroSerie: document.getElementById('numero-serie')?.value || "",
                patrimonio: document.getElementById('patrimonio')?.value || "",
                dataEntrada: document.getElementById('data-entrada')?.value || "",
                dataSaida: document.getElementById('data-saida')?.value || "",
                tempoGarantia: document.getElementById('tempo-garantia')?.value || "90 dias",
                garantiaServicoAnterior: document.getElementById('garantia-servico-anterior')?.checked || false,
                garantiaCompra: document.getElementById('garantia-compra')?.checked || false,
                defeito: document.getElementById('defeito')?.value || "",
                servicoRealizar: document.getElementById('servico-realizar')?.value || "",
                situacao: document.getElementById('situacao')?.value || "Aguardando",
                pecas: pecasTratadas,
                valorMaoObra: parseFloat(document.getElementById('valor-mao-obra')?.value) || 0,
                valorTotal: valorTotalLimpo
            };

            try {
                const resposta = await fetch('/cadastrar_os', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosOS)
                });

                const resultado = await resposta.json();

                if (resposta.ok) {
                    alert('Ordem de Serviço criada com sucesso!');
                    window.location.href = `../ordens_Servico/ordens_Servico.html`;
                } else {
                    alert(resultado.mensagem || 'Erro ao criar Ordem de Serviço.');
                }
            } catch (erro) {
                console.error('Erro ao salvar OS:', erro);
                alert('Erro de conexão com o servidor.');
            }
        });
    }
});

// Funções Utilitárias Globais

function voltarPagina() {
    if (confirm('Deseja realmente sair do formulário? Dados não salvos serão perdidos.')) {
        window.location.href = '../ordens_Servico/ordens_Servico.html';
    }
}

function limparFormulario() {
    const formOS = document.getElementById('form-os');
    const containerCampos = document.getElementById('container-campos-os');
    const lblCpf = document.getElementById('lbl-cliente-cpf');
    const lblCidade = document.getElementById('lbl-cliente-cidade');
    const lblCelular = document.getElementById('lbl-cliente-celular');

    if (formOS) formOS.reset();
    if (containerCampos) containerCampos.disabled = true;

    if (lblCpf) lblCpf.textContent = '---';
    if (lblCidade) lblCidade.textContent = '---';
    if (lblCelular) lblCelular.textContent = '---';

    const elementosInterativos = document.querySelectorAll('button, input, select, textarea');
    elementosInterativos.forEach(elem => {
        if (elem.id !== 'btn-enviar-orcamento' && elem.id !== 'btn-adicionar-peca') {
            elem.disabled = false;
        }
    });

    pecasAdicionadas = [];
    renderTabelaPecas();

    const dataEntradaInput = document.getElementById('data-entrada');
    if (dataEntradaInput) {
        dataEntradaInput.value = new Date().toISOString().split('T')[0];
    }
}

function renderTabelaPecas() {
    const tabelaPecasBody = document.getElementById('tabela-pecas-body');
    const valorTotalInput = document.getElementById('valor-total');
    const inputMaoDeObra = document.getElementById('valor-mao-obra');

    if (!tabelaPecasBody) return;

    let subtotalPecas = 0;

    if (pecasAdicionadas.length === 0) {
        tabelaPecasBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma peça adicionada.</td></tr>';
    } else {
        tabelaPecasBody.innerHTML = "";
        pecasAdicionadas.forEach((item, index) => {
            subtotalPecas += item.subtotal;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-start fw-semibold">${item.descricao}</td>
                <td class="text-center">${item.quantidade}</td>
                <td class="text-end">R$ ${(item.valorUnitario || 0).toFixed(2)}</td>
                <td class="text-end fw-bold">R$ ${(item.subtotal || 0).toFixed(2)}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="removerPeca(${index})" title="Remover Peça">
                        &times;
                    </button>
                </td>
            `;
            tabelaPecasBody.appendChild(tr);
        });
    }

    const valorMaoObra = parseFloat(inputMaoDeObra?.value) || 0;
    const totalGeral = subtotalPecas + valorMaoObra;

    if (valorTotalInput) {
        valorTotalInput.value = totalGeral.toFixed(2);
    }
}

window.removerPeca = function(index) {
    pecasAdicionadas.splice(index, 1);
    renderTabelaPecas();
};

async function carregarClientesSelect() {
    const selectCliente = document.getElementById('select-cliente');
    if (!selectCliente) return;

    try {
        const res = await fetch('/registros_Cliente');
        const clientes = await res.json();
        listaClientes = clientes || [];

        selectCliente.innerHTML = '<option value="" disabled selected>-- Escolha um Cliente --</option>';

        if (listaClientes.length > 0) {
            listaClientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.customId || c._id;
                opt.textContent = `${c.nome} - (${c.cidade || 'Sem cidade'})`;
                selectCliente.appendChild(opt);
            });
        } else {
            selectCliente.innerHTML = '<option value="">Nenhum cliente cadastrado</option>';
        }
    } catch (err) {
        console.error('Erro ao carregar lista de clientes:', err);
        selectCliente.innerHTML = '<option value="">Erro ao carregar clientes</option>';
    }
}

async function carregarProdutosSelect() {
    const selectPeca = document.getElementById('select-peca');
    if (!selectPeca) return;

    try {
        const res = await fetch('/buscar_Produtos');
        if (res.ok) {
            produtosCarregados = await res.json();
            selectPeca.innerHTML = '<option value="">Selecione uma peça...</option>';

            produtosCarregados.forEach(p => {
                const opt = document.createElement('option');
                const idChave = p._id || p.customId;
                const preco = parseFloat(p.preco_venda || p.preco_unitario || p.valor) || 0;
                const estoque = p.qtd_atual ?? p.quantidade ?? 0;
                const descricao = p.descricao || p.nome || 'Produto sem nome';

                opt.value = idChave;
                opt.textContent = `${descricao} (Estoque: ${estoque}) - R$ ${preco.toFixed(2)}`;
                selectPeca.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
    }
}

function verificarSessao() {
    fetch('/verificar_sessao_administrador')
        .then(res => res.json())
        .then(data => {
            if (!data.logado) {
                alert('Sessão expirada. Faça login novamente.');
                window.location.href = '../administrador_Login/administrador_Login.html';
            } else {
                const elementoBoasVindas = document.getElementById('usuario-boas-vindas');
                if (elementoBoasVindas) {
                    elementoBoasVindas.textContent = `Bem-vindo(a), ${data.nome}`;
                }
            }
        })
        .catch(err => console.error('Erro na verificação de sessão:', err));
}